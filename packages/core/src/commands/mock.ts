import { intro, isCancel, log, mock, outro, prompt } from "@fex/kit";

export interface MockCommandOptions {
  from?: string;
  out?: string;
}

const FIELD_KINDS = {
  name: "person.fullName",
  email: "internet.email",
  uuid: "string.uuid",
  int: "number.int",
  boolean: "datatype.boolean",
  sentence: "lorem.sentence",
  date: "date.recent",
  url: "internet.url",
} as const;

async function guidedSchema(): Promise<Record<string, string>> {
  const schema: Record<string, string> = {};

  for (;;) {
    const fieldName = await prompt.text({ message: "Field name? (leave empty to finish)" });
    if (isCancel(fieldName)) process.exit(1);
    if (!fieldName) break;

    const kind = await prompt.select({
      message: `Type for "${fieldName}"?`,
      options: Object.keys(FIELD_KINDS).map((key) => ({ value: key, label: key })),
    });
    if (isCancel(kind)) process.exit(1);

    schema[fieldName as string] = FIELD_KINDS[kind as keyof typeof FIELD_KINDS];
  }

  return schema;
}

export async function mockCommand(
  countArg: string | undefined,
  options: MockCommandOptions,
): Promise<void> {
  intro("fex mock");

  const count = countArg ? Number(countArg) : 5;

  try {
    let records: unknown[];

    if (options.from) {
      const sample = JSON.parse(await Bun.file(options.from).text());
      records = await mock.fromSample(Array.isArray(sample) ? sample[0] : sample, count);
    } else {
      const schema = await guidedSchema();
      records = Object.keys(schema).length > 0 ? await mock.fake(schema, count) : [];
    }

    const json = JSON.stringify(records, null, 2);
    if (options.out) {
      await Bun.write(options.out, json);
      log.success(`Wrote ${records.length} record(s) to ${options.out}`);
    } else {
      console.log(json);
    }
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }

  outro("done");
}
