import { PeerJS, t, StringUtil, Uri } from './common';

type ConnectionKind = t.PeerNetworkConnectRes['kind'];

export type SelfRef = {
  id: t.PeerId;
  peer: PeerJS;
  createdAt: number;
  signal: t.PeerSignallingEndpoint;
  connections: ConnectionRef[];
  media: { video?: MediaStream; screen?: MediaStream };
};

export type ConnectionRef = {
  kind: t.PeerConnectionKind;
  peer: t.PeerConnectionStatus['peer'];
  id: t.PeerConnectionId;
  uri: t.PeerConnectionUri;
  conn: PeerJS.DataConnection | PeerJS.MediaConnection;
  direction: t.PeerConnectDirection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  parent?: t.PeerConnectionId;
};

/**
 * Memory references to network objects.
 */
export function MemoryRefs() {
  const self: { [id: string]: SelfRef } = {};

  const refs = {
    self,

    connection(input: SelfRef | string) {
      const self = typeof input === 'string' ? refs.self[input] : input;
      type C = PeerJS.DataConnection | PeerJS.MediaConnection;
      const getId = (conn: C) => StringUtil.formatConnectionId((conn as any).connectionId);
      return {
        add(
          kind: ConnectionKind,
          direction: t.PeerConnectDirection,
          conn: PeerJS.DataConnection | PeerJS.MediaConnection,
          remoteStream?: MediaStream,
        ) {
          const remote = conn.peer;
          const peer = { self: self.peer.id, remote };
          const id = getId(conn);
          const uri = Uri.connection(kind, remote, id);

          const existing = self.connections.find((item) => item.uri === uri);
          if (existing) return existing;

          const metadata = conn.metadata as t.PeerConnectionMetadata;
          const parent = metadata.parent;
          const ref: ConnectionRef = { kind, uri, id, peer, direction, conn, remoteStream, parent };
          self.connections = [...self.connections, ref];

          return ref;
        },

        remove(conn: C) {
          self.connections = self.connections.filter((item) => item.conn !== conn);
        },

        get(conn: C) {
          const id = getId(conn);
          const ref = self.connections.find((ref) => ref.id == id);
          if (!ref) {
            const remote = conn.peer;
            const err = `The connection reference '${remote}' for local network '${self.id}' has not been added`;
            throw new Error(err);
          }
          return ref;
        },

        get data() {
          return self.connections
            .filter((ref) => ref.kind === 'data')
            .map((ref) => ref.conn as PeerJS.DataConnection);
        },

        get media() {
          return self.connections
            .filter((ref) => ref.kind === 'media/video' || ref.kind === 'media/screen')
            .map((ref) => ref.conn as PeerJS.MediaConnection);
        },

        get ids() {
          return self.connections.map((ref) => ref.peer.remote);
        },
      };
    },

    dispose() {
      Object.keys(refs.self).forEach((key) => delete refs.self[key]);
    },
  };

  return refs;
}
