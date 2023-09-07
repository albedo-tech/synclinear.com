import { CheckIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {
    LinearContext,
    LinearObject,
    LinearTeam,
    TicketState
} from "../typings";
import { clearURLParams } from "../utils";
import { v4 as uuid } from "uuid";
import { LINEAR } from "../utils/constants";
import DeployButton from "./DeployButton";
import {
    exchangeLinearToken,
    getLinearContext,
    checkTeamWebhook,
    getLinearAuthURL,
    saveLinearContext,
    setLinearWebhook,
    checkUniqueLabelForTeam
} from "../utils/linear";
import Select from "./Select";
import {Context} from "./ContextProvider";

interface IProps {
    onAuth: (apiKey: string) => void;
    onDeployWebhook: (context: LinearContext) => void;
    restoredApiKey: string;
    syncLabel: string;
    syncCreated: boolean;
}

const LinearAuthButton = ({
    onAuth,
    onDeployWebhook,
    restoredApiKey,
    syncLabel,
    syncCreated
}: IProps) => {
    const [teams, setTeams] = useState<Array<LinearTeam>>([]);
    const [chosenTeam, setChosenTeam] = useState<LinearTeam>();
    const [linearLabelId, setLinearLabelId] = useState("");
    const [ticketStates, setTicketStates] = useState<{
        [key in TicketState]: LinearObject;
    }>();
    const [deployed, setDeployed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isUniqueSyncLabelForTeam, setIsUniqueSyncLabelForTeam] = useState(false);

    const { linearToken, setLinearToken, linearUser, setLinearUser } =
        useContext(Context);

    useEffect(() => {
        setLoading(false);
    }, [syncCreated])

    useEffect(() => {
        onDeployWebhook({
            userId: linearUser ? linearUser.id : "",
            teamId: chosenTeam ? chosenTeam.id : "",
            apiKey: linearToken,
            label: syncLabel,
            linearLabelId: linearLabelId
        });
    }, [linearUser, chosenTeam, linearToken, syncLabel, linearLabelId])

    // Сheck the uniqueness of the label for the team
    useEffect(() => {
        if (!syncLabel || !chosenTeam) return;

        checkUniqueLabelForTeam(chosenTeam.id, syncLabel).then(
            res => {
                setIsUniqueSyncLabelForTeam(res.checkingResult);
                if (!res.checkingResult) {
                    alert(res.error)
                }
            }
        ).catch(err => {
            // alert(`Error checking label: ${err}`);
            setIsUniqueSyncLabelForTeam(false);
        });
    },[syncLabel, chosenTeam])

    // If present, exchange the temporary auth code for an access token
    useEffect(() => {
        if (linearToken) return;

        // If the URL params have an auth code, we're returning from the Linear auth page
        const authResponse = new URLSearchParams(window.location.search);
        if (!authResponse.has("code")) return;

        // Ensure the verification code is unchanged
        const verificationCode = localStorage.getItem("linear-verification");
        if (!authResponse.get("state")?.includes("linear")) return;
        if (authResponse.get("state") !== verificationCode) {
            alert("Linear auth returned an invalid code. Please try again.");
            return;
        }

        setLoading(true);

        // Exchange auth code for access token
        const refreshToken = authResponse.get("code");
        exchangeLinearToken(refreshToken)
            .then(body => {
                if (body.access_token) setLinearToken(body.access_token);
                else {
                    clearURLParams();
                    localStorage.removeItem(LINEAR.STORAGE_KEY);
                }
                setLoading(false);
            })
            .catch(err => {
                alert(`Error fetching access token: ${err}`);
                setLoading(false);
            });
    }, [linearToken]);

    // Restore the Linear context from local storage
    useEffect(() => {
        if (restoredApiKey) setLinearToken(restoredApiKey);
    }, [restoredApiKey]);

    // Fetch the user ID and available teams when the token is available
    useEffect(() => {
        if (!linearToken) return;
        if (linearUser?.id) return;

        onAuth(linearToken);

        getLinearContext(linearToken)
            .then(res => {
                if (!res?.data?.teams || !res.data?.viewer)
                    alert("No Linear user or teams found");

                setTeams(res.data.teams.nodes);
                setLinearUser(res.data.viewer);
            })
            .catch(err => alert(`Error fetching labels: ${err}`));
    }, [linearToken]);

    // Disable deployment button if the webhook and team are already saved
    useEffect(() => {
        if (!chosenTeam || !linearToken || !syncLabel) return;
        setLoading(true);

        checkTeamWebhook(chosenTeam.id, chosenTeam.name, linearToken)
            .then(res => {
                if (res?.webhookExists && res?.teamInDB) {
                    setDeployed(true);
                    onDeployWebhook({
                        userId: linearUser.id,
                        teamId: chosenTeam.id,
                        apiKey: linearToken,
                        label: syncLabel,
                        linearLabelId: linearLabelId
                    });
                } else {
                    setDeployed(false);
                }
                setLoading(false);
            })
            .catch(err => {
                alert(`Error checking for existing labels: ${err}`);
                setLoading(false);
            });
    }, [chosenTeam, linearToken, linearUser, syncLabel, linearLabelId]);

    // Populate default ticket states when available
    useEffect(() => {
        const states = chosenTeam?.states?.nodes;
        if (!states || !states?.length) return;

        setTicketStates({
            todo: states.find(s => s.name === LINEAR.TICKET_STATES.todo),
            done: states.find(s => s.name === LINEAR.TICKET_STATES.done),
            canceled: states.find(s => s.name === LINEAR.TICKET_STATES.canceled)
        });
    }, [chosenTeam]);

    const openLinearAuth = () => {
        // Generate random code to validate against CSRF attack
        const verificationCode = `linear-${uuid()}`;
        localStorage.setItem("linear-verification", verificationCode);

        const authURL = getLinearAuthURL(verificationCode);
        window.location.replace(authURL);
    };

    const deployWebhook = useCallback(() => {
        if (!chosenTeam || !syncLabel) return;

        setLoading(true);

        saveLinearContext(linearToken, chosenTeam, ticketStates, syncLabel)
            .then((labelId) => {
                setLinearLabelId(labelId);
            })
            .catch(err =>
            alert(`Error saving labels to DB: ${err}`)
        );

        setLinearWebhook(linearToken, chosenTeam.id)
            .then(() => {
                setDeployed(true);
                onDeployWebhook({
                    userId: linearUser.id,
                    teamId: chosenTeam.id,
                    apiKey: linearToken,
                    label: syncLabel,
                    linearLabelId: linearLabelId
                });
            })
            .catch(err => {
                if (err?.message?.includes("url not unique")) {
                    // alert("Webhook already deployed");
                    onDeployWebhook({
                        userId: linearUser.id,
                        teamId: chosenTeam.id,
                        apiKey: linearToken,
                        label: syncLabel,
                        linearLabelId: linearLabelId
                    });
                    setDeployed(true);
                    return;
                }

                setDeployed(false);
                alert(`Error deploying webhook: ${err}`);
            });
    }, [linearToken, chosenTeam, syncLabel, linearLabelId, deployed, linearUser, ticketStates]);

    const missingTicketState = useMemo<boolean>(() => {
        return (
            !ticketStates || Object.values(ticketStates).some(state => !state)
        );
    }, [ticketStates]);

    return (
        <div className="center space-y-8 w-80">
            <button
                onClick={openLinearAuth}
                disabled={!!linearToken || loading}
                className={loading ? "animate-pulse" : ""}
                arial-label="Authorize with Linear"
            >
                {loading ? (
                    <>
                        <span>Loading</span>
                        <DotsHorizontalIcon className="w-6 h-6" />
                    </>
                ) : (
                    <span>1. Connect Linear</span>
                )}
                {!!linearToken && <CheckIcon className="w-6 h-6" />}
            </button>
            {teams.length > 0 && syncLabel && (
                <div className="flex flex-col items-center w-full space-y-4">
                    <Select
                        values={teams.map(team => ({
                            value: team.id,
                            label: team.name
                        }))}
                        onChange={(id: string) =>
                            setChosenTeam(teams.find(team => team.id === id))
                        }
                        disabled={loading}
                        placeholder="4. Find your team"
                    />
                    {chosenTeam?.states?.nodes && (
                        <div className="w-full space-y-4 pb-4">
                            {Object.entries(LINEAR.TICKET_STATES).map(
                                ([key, label]: [TicketState, string]) => (
                                    <div
                                        key={key}
                                        className="flex justify-between items-center gap-4"
                                    >
                                        <p className="whitespace-nowrap">
                                            "{label}" label:
                                        </p>
                                        <Select
                                            placeholder={
                                                ticketStates?.[key]?.name ||
                                                "Select a label"
                                            }
                                            values={chosenTeam.states.nodes.map(
                                                state => ({
                                                    value: state.id,
                                                    label: state.name
                                                })
                                            )}
                                            onChange={(id: string) =>
                                                setTicketStates({
                                                    ...ticketStates,
                                                    [key]: chosenTeam.states.nodes.find(
                                                        state => state.id === id
                                                    )
                                                })
                                            }
                                            disabled={loading}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    )}
                    {chosenTeam && isUniqueSyncLabelForTeam && (
                        <DeployButton
                            disabled={missingTicketState}
                            loading={loading}
                            deployed={(deployed && syncCreated) || (!!chosenTeam.id && !!linearLabelId && !!linearToken) }
                            onDeploy={deployWebhook}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default LinearAuthButton;

