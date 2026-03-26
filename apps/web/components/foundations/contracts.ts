export type ViewProps<TProps extends Record<string, unknown> = Record<string, unknown>> =
  Readonly<TProps>;

export type ScreenProps<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> = Readonly<TProps>;

export interface ViewContract {
  readonly componentId: string;
  readonly testId: string;
}
