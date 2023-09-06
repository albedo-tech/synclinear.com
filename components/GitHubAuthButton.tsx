import { CheckIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { GitHubContext, GitHubRepo } from "../typings";
import { clearURLParams } from "../utils";
import { v4 as uuid } from "uuid";
import {GITHUB} from "../utils/constants";
import DeployButton from "./DeployButton";
import {
    exchangeGitHubToken,
    listReposForUser,
    getGitHubUser,
    getRepoWebhook,
    getGitHubAuthURL,
    saveGitHubContext,
    setGitHubWebook,
    checkUniqueLabelForGithubRepo
} from "../utils/github";
import { Context } from "./ContextProvider";
import Select from "./Select";

interface IProps {
    onAuth: (apiKey: string) => void;
    onDeployWebhook: (context: GitHubContext) => void;
    restoredApiKey: string;
    syncLabel: string;
    syncCreated: boolean;
}

const GitHubAuthButton = ({
    onAuth,
    onDeployWebhook,
    restoredApiKey,
    syncLabel,
    syncCreated
}: IProps) => {
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [chosenRepo, setChosenRepo] = useState<GitHubRepo>();
    const [githubLabelId, setGithubLabelId] = useState("");
    const [deployed, setDeployed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUniqueSyncLabelForGithubRepo, setIsUniqueSyncLabelForGithubRepo] = useState(false);

    const { gitHubToken, setGitHubToken, gitHubUser, setGitHubUser } =
        useContext(Context);

    useEffect(() => {
        setLoading(false);
    }, [syncCreated])

    // Сheck the uniqueness of the label for the repository
    useEffect(() => {
        if (!syncLabel || !chosenRepo) return;

        checkUniqueLabelForGithubRepo(chosenRepo.id, syncLabel).then(
            res => {
                setIsUniqueSyncLabelForGithubRepo(res.checkingResult);
                if (!res.checkingResult) {
                    alert(res.error)
                }
            }
        ).catch(err => {
            // alert(`Error checking label: ${err}`);
            setIsUniqueSyncLabelForGithubRepo(false);
        });
    },[syncLabel, chosenRepo])

    // If present, exchange the temporary auth code for an access token
    useEffect(() => {
        if (gitHubToken) return;

        // If the URL params have an auth code, we're returning from the GitHub auth page
        const authResponse = new URLSearchParams(window.location.search);
        if (!authResponse.has("code")) return;

        // Ensure the verification code is unchanged
        const verificationCode = localStorage.getItem("github-verification");
        if (!authResponse.get("state")?.includes("github")) return;
        if (authResponse.get("state") !== verificationCode) {
            alert("GitHub auth returned an invalid code. Please try again.");
            clearURLParams();
            return;
        }

        setLoading(true);

        // Exchange auth code for access token
        const refreshToken = authResponse.get("code");

        exchangeGitHubToken(refreshToken)
            .then(body => {
                if (body.access_token) setGitHubToken(body.access_token);
                else {
                    clearURLParams();
                    localStorage.removeItem(GITHUB.STORAGE_KEY);
                }
                setLoading(false);
            })
            .catch(err => {
                alert(`Error fetching access token: ${err}`);
                setLoading(false);
            });
    }, []);

    // Restore the GitHub context from local storage
    useEffect(() => {
        if (restoredApiKey) setGitHubToken(restoredApiKey);
    }, [restoredApiKey]);

    // Fetch the user's repos when a token is available
    useEffect(() => {
        if (!gitHubToken || gitHubUser?.id) return;

        onAuth(gitHubToken);

        const startingPage = 0;

        const listReposRecursively = async (page: number): Promise<void> => {
            const res = await listReposForUser(gitHubToken, page);

            if (!res || res.length < 1) {
                setReposLoading(false);
                return;
            }

            setRepos((current: GitHubRepo[]) => [
                ...current,
                ...(res?.map?.(repo => {
                    return { id: repo.id, name: repo.full_name };
                }) ?? [])
            ]);

            return await listReposRecursively(page + 1);
        };

        setReposLoading(true);
        listReposRecursively(startingPage);

        getGitHubUser(gitHubToken)
            .then(res => setGitHubUser({ id: res.id, name: res.login }))
            .catch(err => alert(`Error fetching user profile: ${err}`));
    }, [gitHubToken]);

    // Disable webhook deployment button if the repo already exists
    useEffect(() => {
        if (!chosenRepo || !gitHubUser || !gitHubToken || !syncLabel) return;

        onDeployWebhook({
            userId: gitHubUser.id,
            repoId: chosenRepo.id,
            apiKey: gitHubToken,
            label: syncLabel,
            githubLabelId: githubLabelId
        });

        setLoading(true);

        getRepoWebhook(chosenRepo.name, gitHubToken)
            .then(res => {
                if (res?.exists) {
                    setDeployed(true);
                    onDeployWebhook({
                        userId: gitHubUser.id,
                        repoId: chosenRepo.id,
                        apiKey: gitHubToken,
                        label: syncLabel,
                        githubLabelId: githubLabelId
                    });
                } else {
                    setDeployed(false);
                }
                setLoading(false);
            })
            .catch(err => {
                alert(`Error checking for existing repo: ${err}`);
                setLoading(false);
            });
    }, [gitHubUser, chosenRepo, gitHubToken, syncLabel, githubLabelId]);

    const openAuthPage = () => {
        // Generate random code to validate against CSRF attack
        const verificationCode = `github-${uuid()}`;
        localStorage.setItem("github-verification", verificationCode);

        const authURL = getGitHubAuthURL(verificationCode);
        window.location.replace(authURL);
    };

    const deployWebhook = useCallback(() => {
        if (!chosenRepo || !syncLabel) return;

        setLoading(true);

        const webhookSecret = `${uuid()}`;
        saveGitHubContext(chosenRepo, webhookSecret, gitHubToken, syncLabel, deployed)
            .then((res) => {
                if (res.syncLabelData.createdLabel.id) {
                    setGithubLabelId(res.syncLabelData.createdLabel.id.toString());
                }
            })
            .catch(err => alert(`Error saving repo to DB: ${err}`)
        );

        if (!deployed) {
            setGitHubWebook(gitHubToken, chosenRepo, webhookSecret)
                .then(res => {
                    if (res.errors) {
                        alert(res.errors[0].message);
                        return;
                    }
                    setDeployed(true);
                    onDeployWebhook({
                        userId: gitHubUser.id,
                        repoId: chosenRepo.id,
                        apiKey: gitHubToken,
                        label: syncLabel,
                        githubLabelId: githubLabelId
                    });
                })
                .catch(err => alert(`Error deploying webhook: ${err}`));
        } else {
            setDeployed(true);
            onDeployWebhook({
                userId: gitHubUser.id,
                repoId: chosenRepo.id,
                apiKey: gitHubToken,
                label: syncLabel,
                githubLabelId: githubLabelId
            });
        }

    }, [gitHubToken, chosenRepo, syncLabel, githubLabelId, deployed, gitHubUser, syncCreated]);

    return (
        <div className="center space-y-8 w-80">
            <button
                onClick={openAuthPage}
                disabled={!!gitHubToken || loading}
                className={loading ? "animate-pulse" : ""}
                aria-label="Authorize with GitHub"
            >
                {loading ? (
                    <>
                        <span>Loading</span>
                        <DotsHorizontalIcon className="w-6 h-6" />
                    </>
                ) : (
                    <span>2. Connect GitHub</span>
                )}
                {!!gitHubToken && <CheckIcon className="w-6 h-6" />}
            </button>
            {repos?.length > 0 && gitHubUser && syncLabel && (
                <div className="flex flex-col w-full items-center space-y-4">
                    <Select
                        values={repos.map((repo: GitHubRepo) => ({
                            value: repo.id,
                            label: repo.name
                        }))}
                        onChange={repoId =>
                            setChosenRepo(repos.find(repo => repo.id == repoId))
                        }
                        placeholder="5. Find your repo"
                        loading={reposLoading}
                    />
                    {chosenRepo && isUniqueSyncLabelForGithubRepo && (
                        <DeployButton
                            loading={loading}
                            deployed={(deployed && syncCreated) && (!!chosenRepo.id && !!githubLabelId && !!gitHubToken)}
                            onDeploy={deployWebhook}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default GitHubAuthButton;

