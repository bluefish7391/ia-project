import { Datastore } from "@google-cloud/datastore";

export const datastore = new Datastore({ projectId: "ia-project-2", databaseId: "main" });