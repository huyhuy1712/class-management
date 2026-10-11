export function accountScope(user, version) {
  return user ? `${user.role}:${user.id ?? user.username}:${version}` : null
}

export function resourceKey(account, resource, params = []) {
  return ['account', account, resource, ...params.map(String)]
}

export const EMPTY_LIST = Object.freeze([])
