export class EquipmentCategory {
    #id;
    #name;
    constructor(props) {
        this.#id = props.id;
        this.#name = props.name;
    }
    get id() {
        return this.#id;
    }
    set id(value) {
        this.#id = value;
    }
    get name() {
        return this.#name;
    }
    set name(value) {
        this.#name = value;
    }
}
