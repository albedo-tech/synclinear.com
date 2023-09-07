import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma";

// POST /api/linear/save
export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!req.body)
        return res.status(400).send({ error: "Request is missing body" });
    if (req.method !== "POST")
        return res.status(405).send({
            message: "Only POST requests are accepted."
        });

    const {
        teamId,
        teamName,
        canceledStateId,
        doneStateId,
        toDoStateId,
        members
    } = JSON.parse(req.body);

    if (!teamId) {
        return res
            .status(400)
            .send({ error: "Failed to save team: missing team ID" });
    } else if (!teamName) {
        return res
            .status(400)
            .send({ error: "Failed to save team: missing team name" });
    } else if (
        [canceledStateId, doneStateId, toDoStateId].some(
            id => id === undefined
        )
    ) {
        return res
            .status(400)
            .send({ error: "Failed to save team: missing label or state" });
    } else if (members.length === 0) {
        return res
            .status(400)
            .send({ error: "Failed to save team: missing team members" });
    }

    try {
        const result = await prisma.linearTeam.upsert({
            where: { teamId: teamId },
            update: {
                teamName,
                canceledStateId,
                doneStateId,
                toDoStateId
            },
            create: {
                teamId,
                teamName,
                canceledStateId,
                doneStateId,
                toDoStateId
            }
        });

        try {
            for (const member of members) {
                await prisma.linearTeamMember.upsert({
                    where: {
                        teamId_userId: {
                            teamId: teamId,
                            userId: member.id,
                        },
                    },
                    update: {},
                    create: {
                        teamId,
                        userId: member.id
                    }
                });
            }
        } catch (err) {
            return res.status(400).send({
                error: `Failed to save team member with error: ${err.message || ""}`
            });
        }

        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).send({
            error: `Failed to save team with error: ${err.message || ""}`
        });
    }
}

