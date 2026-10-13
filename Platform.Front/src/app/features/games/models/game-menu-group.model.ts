import { GameMenuItem } from "./game-menu.model";

export interface GameMenuGroup {
    title: string;
    children: GameMenuItem[];
}
