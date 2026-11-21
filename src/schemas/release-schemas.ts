import type { CollectionSchema, ColumnDefinition } from 'deepspace/schema'

const text = (name: string): ColumnDefinition => ({ name, storage: 'text', interpretation: 'plain' })
const number = (name: string): ColumnDefinition => ({ name, storage: 'number', interpretation: 'number' })
const json = (name: string): ColumnDefinition => ({ name, storage: 'text', interpretation: { kind: 'json' } })
const permissions: CollectionSchema['permissions'] = {
  '*': { read: false, create: false, update: false, delete: false },
  viewer: { read: false, create: false, update: false, delete: false },
  member: { read: 'team', create: false, update: false, delete: false },
  admin: { read: 'team', create: false, update: false, delete: false },
}
export const releaseSchemas: CollectionSchema[] = [
  { name: 'releases', teamField: '_rowId', permissions, columns: [
    ...['name', 'version', 'status', 'leadUserId', 'policyVersion', 'decisionBy', 'decisionReason'].map(text),
    number('decisionAt'), json('decisionSnapshot'),
  ] },
  { name: 'team_members', teamField: 'teamId', permissions, uniqueOn: ['teamId', 'userId'], columns: [
    ...['teamId', 'userId', 'status', 'roleInRelease'].map(text), number('addedAt'),
  ] },
  { name: 'gates', teamField: 'releaseId', permissions, uniqueOn: ['releaseId', 'key'], columns: [
    ...['releaseId', 'key', 'title', 'status', 'evidenceNote', 'evidenceUrl', 'verifiedBy'].map(text),
    { name: 'required', storage: 'number', interpretation: { kind: 'boolean' } }, number('verifiedAt'),
  ] },
  { name: 'events', teamField: 'releaseId', permissions, columns: [
    ...['releaseId', 'actorUserId', 'kind', 'summary'].map(text), number('occurredAt'), json('details'),
  ] },
]
