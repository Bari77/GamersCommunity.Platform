import { StaffUserDto } from "./staff-user.dto";
import { SanctionDto } from "./sanction.dto";

export interface StaffUserDetailDto extends StaffUserDto {
    sanctions: SanctionDto[];
}
