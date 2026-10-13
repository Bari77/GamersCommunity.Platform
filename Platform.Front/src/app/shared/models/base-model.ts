export interface DtoConvertible<Tdto, Tmodel> {
    fromDto(dto: Tdto): Tmodel;
}
