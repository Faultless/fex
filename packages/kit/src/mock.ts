import type { Faker } from "@faker-js/faker";
import { optionalImport } from "./lazy";

const INSTALL_HINT = "bun add -D @faker-js/faker";

export type FieldSpec = string | ((faker: Faker) => unknown);
export type Schema = Record<string, FieldSpec>;

async function getFaker(): Promise<Faker> {
  const mod = await optionalImport<typeof import("@faker-js/faker")>(
    "@faker-js/faker",
    INSTALL_HINT,
  );
  return mod.faker;
}

function resolveField(faker: Faker, spec: FieldSpec): unknown {
  if (typeof spec === "function") return spec(faker);
  const value = spec.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, faker);
  return typeof value === "function" ? (value as () => unknown)() : value;
}

/** Generates `count` fake records from a schema of dot-paths into faker (e.g. "internet.email") or custom functions. */
export async function fake<T = Record<string, unknown>>(schema: Schema, count = 1): Promise<T[]> {
  const faker = await getFaker();
  return Array.from({ length: count }, () => {
    const record: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(schema)) {
      record[key] = resolveField(faker, spec);
    }
    return record as T;
  });
}

/** Naive shape inference: generates `count` fake records matching a sample object's field names/types. */
export async function fromSample<T = Record<string, unknown>>(
  sample: Record<string, unknown>,
  count = 1,
): Promise<T[]> {
  const faker = await getFaker();
  return Array.from({ length: count }, () => {
    const record: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sample)) {
      record[key] = guessValue(faker, key, value);
    }
    return record as T;
  });
}

function guessValue(faker: Faker, key: string, sampleValue: unknown): unknown {
  const lowerKey = key.toLowerCase();
  if (typeof sampleValue === "number") return faker.number.int({ min: 1, max: 9999 });
  if (typeof sampleValue === "boolean") return faker.datatype.boolean();
  if (Array.isArray(sampleValue)) return [];
  if (lowerKey.includes("email")) return faker.internet.email();
  if (lowerKey === "id" || lowerKey.endsWith("id")) return faker.string.uuid();
  if (lowerKey.includes("name")) return faker.person.fullName();
  if (lowerKey.includes("phone")) return faker.phone.number();
  if (lowerKey.includes("address")) return faker.location.streetAddress();
  if (lowerKey.includes("url") || lowerKey.includes("avatar") || lowerKey.includes("image")) {
    return faker.image.url();
  }
  if (lowerKey.includes("date") || lowerKey.endsWith("at"))
    return faker.date.recent().toISOString();
  return faker.word.words({ count: 3 });
}
