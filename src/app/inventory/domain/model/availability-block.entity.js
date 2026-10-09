export class AvailabilityBlock {
    #id;
    #period;
    #rentalRequestId;
    constructor(props) {
        this.#id = props.id;
        this.#period = props.period;
        const requestId = props.rentalRequestId ?? null;
        if (requestId !== null && (!Number.isInteger(requestId) || requestId <= 0)) {
            throw new Error('Invalid rental request identifier');
        }
        this.#rentalRequestId = requestId;
    }
    get rentalRequestId() {
        return this.#rentalRequestId;
    }
    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get period() {
        return this.#period;
    }
    set period(value) {
        this.#period = value;
    }
    overlaps(period) {
        return this.#period.overlaps(period);
    }
}
