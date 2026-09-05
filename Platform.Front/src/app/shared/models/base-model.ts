export interface DtoConvertible<Tdto, Tmodel> {
    fromDto(dto: Tdto): Tmodel;
}

export interface DtoConvertibleClass<Tdto, Tmodel> {
    new (...args: any[]): Tmodel;
    fromDto(dto: Tdto): Tmodel;
}
