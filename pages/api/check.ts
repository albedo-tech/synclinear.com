import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../prisma";

// POST /api/check
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
    
    const { githubRepoId, linearTeamId } = JSON.parse(req.body);

    // Check for each required field
    if (!githubRepoId || !linearTeamId) {
        return res
            .status(404)
            .send({ error: "Failed to check sync: missing GH repo ID or linear team id" });
    }

    try {
        const syncs = await prisma.sync.count({
            where: {
                githubRepoId,
                linearTeamId
            }
        })

        return res.status(200).send({ exists: syncs > 0 });
    } catch (err) {
        console.log("Error checking sync:", err.message);
        return res.status(404).send({
            error: `Failed to check sync with error: ${err.message || ""}`
        });
    }
}

