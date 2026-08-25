export abstract class Repository<Row, Domain> {
  protected abstract mapToDomain(row: Row): Domain;
}
