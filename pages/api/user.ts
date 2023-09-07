import type {NextApiRequest, NextApiResponse} from "next";
import prisma from "../../prisma";
import {LinearClient} from "@linear/sdk";
import {LINEAR} from "../../utils/constants";
import {decrypt, encrypt} from "../../utils";
import got from "got";
import {upsertUser} from "./utils";

// POST /api/user
export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!req.body)
        return res.status(400).send({message: "Request is missing body"});
    if (req.method !== "POST") {
        return res.status(405).send({
            message: "Only POST requests are accepted."
        });
    }

    const {github, linear} = JSON.parse(req.body);

    const result = await upsertUser(github, linear);

    if (result.success) {
        return res.status(200).send({success: true})
    } else {
        return res.status(404).send({
            error: result.error
        })
    }
}

