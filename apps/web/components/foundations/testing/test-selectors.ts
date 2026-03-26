export function createTestSelector(scope: string, slot?: string) {
  return slot ? `${scope}.${slot}` : scope;
}
