import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

// POST /api/save
export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!req.body)
        return res.status(400).send({ message: "Request is missing body" });
    if (req.method !== "POST") {
        return res.status(405).send({
            message: "Only POST requests are accepted."
        });
    }
    
    const { github, linear } = JSON.parse(req.body);
    const linearLabelId = linear.linearLabelId;
    const githubLabelId = github.githubLabelId;
    const label = linear.label;

    // Check for each required field
    if (!github?.userId) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing GH user ID" });
    } else if (!github?.repoId) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing GH repo ID" });
    } else if (!linear?.userId) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing Linear user ID" });
    } else if (!linear?.teamId) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing Linear team ID" });
    } else if (!linear?.apiKey || !github?.apiKey) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing API key" });
    } else if (!linear?.label) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing label" });
    } else if (!linear?.linearLabelId) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing linear label id" });
    } else if (!github?.githubLabelId) {
        return res
            .status(404)
            .send({ error: "Failed to save sync: missing github label id" });
    }

    try {
        await prisma.sync.upsert({
            where: {
                githubUserId_linearUserId_githubRepoId_linearTeamId: {
                    githubUserId: github.userId,
                    linearUserId: linear.userId,
                    githubRepoId: github.repoId,
                    linearTeamId: linear.teamId
                }
            },
            update: {
                githubLabelId,
                linearLabelId,
                label
            },
            create: {
                // GitHub
                githubUserId: github.userId,
                githubRepoId: github.repoId,
                githubLabelId,

                // Linear
                linearUserId: linear.userId,
                linearTeamId: linear.teamId,
                linearLabelId,

                label
            }
        });

        return res.status(200).send({ message: "Saved successfully" });
    } catch (err) {
        console.log("Error saving sync:", err.message);
        return res.status(404).send({
            error: `Failed to save sync with error: ${err.message || ""}`
        });
    }
}

