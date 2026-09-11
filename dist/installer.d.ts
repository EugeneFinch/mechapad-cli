interface InstallResult {
    target: string;
    status: "installed" | "updated" | "already_configured" | "skipped";
    path: string;
    notes?: string;
}
export declare function runAgentInstaller(): Promise<InstallResult[]>;
export {};
//# sourceMappingURL=installer.d.ts.map