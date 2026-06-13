export type ProjectStatus = "active" | "archived";

export type ProjectRecord = {
  projectId: string;
  name: string;
  rootPath: string;
  vaultPath: string;
  status: ProjectStatus;
  connectedAt: string;
  updatedAt: string;
  projectDocumentPath?: string;
  packageName?: string;
  packageVersion?: string;
  gitRemote?: string;
  description?: string;
};

export type DetectedProject = {
  projectId: string;
  name: string;
  rootPath: string;
  vaultPath: string;
  packageName?: string;
  packageVersion?: string;
  gitRemote?: string;
  description?: string;
};
