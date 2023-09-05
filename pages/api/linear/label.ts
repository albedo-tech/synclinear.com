import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma";

// POST /api/linear/label
export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!req.body) {
        return res.status(400).send({ error: "Request is missing body" });
    }
    if (req.method !== "POST") {
        return res.status(405).send({
            message: "Only POST requests are accepted."
        });
    }

    const {
        teamId,
        label
    } = req.body;

    // Check for each required field
    if (!teamId) {
        return res
            .status(404)
            .send({ error: "Failed to check label: missing Linear team ID" });
    } else if (!label) {
        return res
            .status(404)
            .send({ error: "Failed to check label: missing label" });
    }

    const sync = await prisma.sync.findFirst({
        where: {
            linearTeamId: teamId,
            label
        },
    });

    if (!sync) {
        return res.status(200).send({checkingResult: true});
    } else {
        console.log("Error checking label: label is not unique for team");
        return res.status(404).send({
            checkingResult: false,
            error: "Failed to check label with error: label is not unique for team"
        });
    }
}

