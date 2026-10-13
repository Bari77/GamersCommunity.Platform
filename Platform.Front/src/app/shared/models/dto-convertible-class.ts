export interface DtoConvertibleClass<Tdto, Tmodel> {
    new (...args: any[]): Tmodel;
    fromDto(dto: Tdto): Tmodel;
}
