import { LinearClient } from "@linear/sdk";
import got from "got";
import type { NextApiResponse } from "next/types";
import prisma from "../../prisma";
import {
    GitHubContext,
    GitHubIssueLabel,
    GitHubMarkdownOptions, LinearContext,
    Platform
} from "../../typings";
import {GITHUB, LINEAR} from "../../utils/constants";
import {decrypt, encrypt, replaceImgTags, replaceStrikethroughTags} from "../../utils";

/**
 * Server-only utility functions
 */
export default (_, res: NextApiResponse) => {
    return res.status(200).send({ message: "Nothing to see here!" });
};

/**
 * Map a Linear username to a GitHub username in the database if not already mapped
 *
 * @param githubContext
 * @param linearContext
 */
export const upsertUser = async (
    githubContext: GitHubContext,
    linearContext: LinearContext,
): Promise< {
    success: boolean;
    error?: string;
}> => {
    try {
        // Encrypt the API keys
        const {hash: linearApiKey, initVector: linearApiKeyIV} = encrypt(
            linearContext.apiKey
        );
        const {hash: githubApiKey, initVector: githubApiKeyIV} = encrypt(
            githubContext.apiKey
        );

        const linearKey = process.env.LINEAR_API_KEY
            ? process.env.LINEAR_API_KEY
            : decrypt(linearApiKey, linearApiKeyIV);

        const linearClient = new LinearClient({
            apiKey: linearKey,
            headers: {
                ...LINEAR.PUBLIC_QUERY_HEADERS
            }
        });

        const githubKey = process.env.GITHUB_API_KEY
            ? process.env.GITHUB_API_KEY
            : decrypt(githubApiKey, githubApiKeyIV);

        const githubAuthHeader = `token ${githubKey}`;
        const userAgentHeader = `linear-github-sync`;

        // Map the user's Linear username to their GitHub username if not yet mapped
        const linearUser = await linearClient.viewer;

        const githubUserResponse = await got.get(
            `https://api.github.com/user`,
            {
                headers: {
                    "User-Agent": userAgentHeader,
                    Authorization: githubAuthHeader
                }
            }
        );
        const githubUserBody = JSON.parse(githubUserResponse.body);

        await prisma.user.upsert({
            where: {
                githubUserId_linearUserId: {
                    githubUserId: parseInt(githubContext.userId),
                    linearUserId: linearContext.userId
                }
            },
            update: {
                githubUsername: githubUserBody.login,
                githubEmail: githubUserBody.email ?? "",
                linearUsername: linearUser.displayName,
                linearEmail: linearUser.email ?? "",
                githubApiKey,
                githubApiKeyIV,
                linearApiKey,
                linearApiKeyIV
            },
            create: {
                githubUserId: parseInt(githubContext.userId),
                linearUserId: linearContext.userId,
                githubUsername: githubUserBody.login,
                githubEmail: githubUserBody.email ?? "",
                linearUsername: linearUser.displayName,
                linearEmail: linearUser.email ?? "",
                linearApiKey,
                linearApiKeyIV,
                githubApiKey,
                githubApiKeyIV
            }
        });

        return {success: true}
    } catch (err) {
        return {success: false, error: err}
    }
};

/**
 * Translate users' usernames from one platform to the other
 * @param {string[]} usernames of Linear or GitHub users
 * @returns {string[]} Linear and GitHub usernames corresponding to the provided usernames
 */
export const mapUsernames = async (
    usernames: string[],
    platform: "linear" | "github"
): Promise<Array<{ githubUsername: string; linearUsername: string }>> => {
    console.log(`Mapping ${platform} usernames`);

    const filters = usernames.map((username: string) => {
        return { [`${platform}Username`]: username };
    });

    const existingUsers = await prisma.user.findMany({
        where: {
            OR: filters
        },
        select: {
            githubUsername: true,
            linearUsername: true
        }
    });

    if (!existingUsers?.length) return [];

    return existingUsers;
};

/**
 * Replace all mentions of users with their username in the corresponding platform
 * @param {string} body the message to be sent
 * @returns {string} the message with all mentions replaced
 */
export const replaceMentions = async (body: string, platform: Platform) => {
    if (!body?.match(/(?<=@)\w+/g)) return body;

    console.log(`Replacing ${platform} mentions`);

    let sanitizedBody = body;

    const mentionMatches = sanitizedBody.matchAll(/(?<=@)\w+/g) ?? [];
    const userMentions =
        Array.from(mentionMatches)?.map(mention => mention?.[0]) ?? [];

    const userMentionReplacements = await mapUsernames(userMentions, platform);

    userMentionReplacements.forEach(mention => {
        sanitizedBody = sanitizedBody.replace(
            new RegExp(`@${mention[`${platform}Username`]}`, "g"),
            `@${
                mention[
                    `${platform === "linear" ? "github" : "linear"}Username`
                ]
            }`
        );
    });

    return sanitizedBody;
};

export const createLabel = async ({
    repoFullName,
    label,
    githubAuthHeader,
    userAgentHeader
}: {
    repoFullName: string;
    label: GitHubIssueLabel;
    githubAuthHeader: string;
    userAgentHeader: string;
}): Promise<{
    createdLabel?: { name: string } | undefined;
    error?: boolean;
}> => {
    let error = false;

    const createdLabelResponse = await got.post(
        `${GITHUB.REPO_ENDPOINT}/${repoFullName}/labels`,
        {
            json: {
                name: label.name,
                color: label.color?.replace("#", ""),
                description: `Created by Linear-GitHub Sync`
            },
            headers: {
                Authorization: githubAuthHeader,
                "User-Agent": userAgentHeader
            },
            throwHttpErrors: false
        }
    );

    let createdLabel = JSON.parse(createdLabelResponse.body);

    if (
        createdLabelResponse.statusCode > 201 &&
        createdLabel.errors?.[0]?.code !== "already_exists"
    ) {
        error = true;
    } else if (
        createdLabelResponse.statusCode !== 200 &&
        createdLabel.errors?.[0]?.code === "already_exists"
    ) {
        const githubLabelResponse = await got.get(
            `${GITHUB.REPO_ENDPOINT}/${repoFullName}/labels/${label.name}`,
            {
                headers: {
                    Authorization: githubAuthHeader,
                    "User-Agent": userAgentHeader
                },
                throwHttpErrors: false
            }
        );

        if (githubLabelResponse.statusCode === 200) {
            createdLabel = JSON.parse(githubLabelResponse.body);

            return { createdLabel, error };
        } else {
            error = true;
        }
    }

    return { createdLabel, error };
};

export const applyLabel = async ({
    repoFullName,
    issueNumber,
    labelNames,
    githubAuthHeader,
    userAgentHeader
}: {
    repoFullName: string;
    issueNumber: number;
    labelNames: string[];
    githubAuthHeader: string;
    userAgentHeader: string;
}): Promise<{ error: boolean }> => {
    let error = false;

    const appliedLabelResponse = await got.post(
        `${GITHUB.REPO_ENDPOINT}/${repoFullName}/issues/${issueNumber}/labels`,
        {
            json: {
                labels: labelNames
            },
            headers: {
                Authorization: githubAuthHeader,
                "User-Agent": userAgentHeader
            }
        }
    );

    if (appliedLabelResponse.statusCode > 201) {
        error = true;
    }

    return { error };
};

export const createComment = async ({
    repoFullName,
    issueNumber,
    body,
    githubAuthHeader,
    userAgentHeader
}: {
    repoFullName: string;
    issueNumber: number;
    body: string;
    githubAuthHeader: string;
    userAgentHeader: string;
}): Promise<{ error: boolean }> => {
    let error = false;

    const commentResponse = await got.post(
        `${GITHUB.REPO_ENDPOINT}/${repoFullName}/issues/${issueNumber}/comments`,
        {
            json: {
                body
            },
            headers: {
                Authorization: githubAuthHeader,
                "User-Agent": userAgentHeader
            }
        }
    );

    if (commentResponse.statusCode > 201) {
        error = true;
    }

    return { error };
};

export const prepareMarkdownContent = async (
    markdown: string,
    platform: Platform,
    githubOptions: GitHubMarkdownOptions = {}
): Promise<string> => {
    try {
        let modifiedMarkdown = await replaceMentions(markdown, platform);
        modifiedMarkdown = replaceStrikethroughTags(modifiedMarkdown);
        modifiedMarkdown = replaceImgTags(modifiedMarkdown);

        if (githubOptions?.anonymous && githubOptions?.sender) {
            return `>${modifiedMarkdown}\n\n—[${githubOptions.sender.login} on GitHub](${githubOptions.sender.html_url})`;
        }

        return modifiedMarkdown;
    } catch (error) {
        console.error(error);
        return "An error occurred while preparing the markdown content.";
    }
};
