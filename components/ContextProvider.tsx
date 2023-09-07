import React, { createContext, useState } from "react";
import {GitHubContext, GitHubRepo, LinearContext, LinearObject, Sync} from "../typings";

interface IProps {
    syncs: Sync[];
    setSyncs: (syncs: Sync[]) => void;
    linearToken: string;
    setLinearToken: (token: string) => void;
    linearUser: LinearObject,
    setLinearUser: (user: LinearObject) => void;
    gitHubToken: string;
    setGitHubToken: (token: string) => void;
    gitHubUser: GitHubRepo;
    setGitHubUser: (user: GitHubRepo) => void;
    linearContext: LinearContext;
    setLinearContext: (linearContext: LinearContext) => void;
    gitHubContext: GitHubContext;
    setGitHubContext: (context: GitHubContext) => void;
}

export const Context = createContext<IProps>(null);

const ContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [syncs, setSyncs] = useState<Sync[]>([]);
    const [linearToken, setLinearToken] = useState("");
    const [linearUser, setLinearUser] = useState<LinearObject>();
    const [gitHubToken, setGitHubToken] = useState("");
    const [gitHubUser, setGitHubUser] = useState<GitHubRepo>();
    const [linearContext, setLinearContext] = useState<LinearContext>({
        userId: "",
        teamId: "",
        apiKey: "",
        label: "",
        linearLabelId: ""
    });
    const [gitHubContext, setGitHubContext] = useState<GitHubContext>({
        userId: "",
        repoId: "",
        apiKey: "",
        label: "",
        githubLabelId: ""
    });

    return (
        <Context.Provider
            value={{
                syncs,
                setSyncs,
                linearToken,
                setLinearToken,
                linearUser,
                setLinearUser,
                gitHubToken,
                setGitHubToken,
                gitHubUser,
                setGitHubUser,
                linearContext,
                setLinearContext,
                gitHubContext,
                setGitHubContext
            }}
        >
            {children}
        </Context.Provider>
    );
};

export default ContextProvider;

