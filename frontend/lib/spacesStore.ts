interface StoredSpace {
  spaceId: string;
  name: string;
  slug: string;
  description: string;
  sdk: string;
  template: string;
  owner: string;
  endpointUrl: string;
  platformUrl?: string;
  localEndpointUrl?: string;
  gitRepo: {
    cloneUrl: string;
    repoPath: string;
  };
  createdAt: number;
  status: 'created' | 'deployed' | 'error' | 'running';
  port?: number;
  processId?: string;
}

const spaces = new Map<string, StoredSpace>();

export const getSpacesByOwner = (owner: string): StoredSpace[] => {
  const result: StoredSpace[] = [];
  spaces.forEach((space) => {
    if (space.owner.toLowerCase() === owner.toLowerCase()) {
      result.push(space);
    }
  });
  return result;
};

export const getAllSpaces = (): StoredSpace[] => {
  return Array.from(spaces.values());
};

export const getSpaceById = (spaceId: string): StoredSpace | undefined => {
  return spaces.get(spaceId);
};

export const addSpace = (space: StoredSpace): void => {
  spaces.set(space.spaceId, space);
};

export const deleteSpace = (spaceId: string): boolean => {
  return spaces.delete(spaceId);
};

export const updateSpaceStatus = (spaceId: string, status: StoredSpace['status']): void => {
  const space = spaces.get(spaceId);
  if (space) {
    space.status = status;
    spaces.set(spaceId, space);
  }
};
