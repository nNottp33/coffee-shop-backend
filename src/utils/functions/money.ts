export type Minor = number

export const toMajor = (minor: Minor): number => {
  return Math.round(minor) / 100
}
