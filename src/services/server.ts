interface Location {
  name: string;
  databaseAccountEndpoint: string;
}

interface ReplicationPolicy {
  asyncReplication?: boolean;
  minReplicaSetSize: number;
  maxReplicasetSize: number;
}

interface ConsistencyPolicy {
  defaultConsistencyLevel: string;
}

interface ReadPolicy {
  primaryReadCoefficient: number;
  secondaryReadCoefficient: number;
}

interface ServerInfo {
  _self: string;
  id: string;
  _rid: string;
  media: string;
  addresses: string;
  _dbs: string;
  writableLocations: Location[];
  readableLocations: Location[];
  enableMultipleWriteLocations: boolean;
  userReplicationPolicy: ReplicationPolicy;
  userConsistencyPolicy: ConsistencyPolicy;
  systemReplicationPolicy: ReplicationPolicy;
  readPolicy: ReadPolicy;
  queryEngineConfiguration: string;
}

export function serverInfo(): ServerInfo {
  return {
    _self: "",
    id: "localhost",
    _rid: "localhost",
    media: "//media/",
    addresses: "//addresses/",
    _dbs: "//dbs/",
    writableLocations: [
      {
        name: "South Central US",
        databaseAccountEndpoint: "https://172.17.0.2:8081/",
      },
    ],
    readableLocations: [
      {
        name: "South Central US",
        databaseAccountEndpoint: "https://172.17.0.2:8081/",
      },
    ],
    enableMultipleWriteLocations: false,
    userReplicationPolicy: {
      asyncReplication: false,
      minReplicaSetSize: 1,
      maxReplicasetSize: 4,
    },
    userConsistencyPolicy: {
      defaultConsistencyLevel: "Session",
    },
    systemReplicationPolicy: {
      minReplicaSetSize: 1,
      maxReplicasetSize: 4,
    },
    readPolicy: {
      primaryReadCoefficient: 1,
      secondaryReadCoefficient: 1,
    },
    queryEngineConfiguration:
      '{"allowNewKeywords":true,"maxJoinsPerSqlQuery":10,"maxQueryRequestTimeoutFraction":0.9,"maxSqlQueryInputLength":524288,"maxUdfRefPerSqlQuery":10,"queryMaxInMemorySortDocumentCount":-1000,"spatialMaxGeometryPointCount":256,"sqlAllowNonFiniteNumbers":false,"sqlDisableOptimizationFlags":0,"enableSpatialIndexing":true,"maxInExpressionItemsCount":2147483647,"maxLogicalAndPerSqlQuery":2147483647,"maxLogicalOrPerSqlQuery":2147483647,"maxSpatialQueryCells":2147483647,"sqlAllowAggregateFunctions":true,"sqlAllowGroupByClause":true,"sqlAllowLike":true,"sqlAllowSubQuery":true,"sqlAllowScalarSubQuery":true,"sqlAllowTop":true}',
  };
}

export default { info: serverInfo };
