export class InvalidRoomCapacityError extends Error {
  constructor(capacity: number, min: number, max: number) {
    super(
      `Room capacity must be an integer between ${min} and ${max}: ${capacity}`,
    );
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
