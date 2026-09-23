export interface GameMenuItem {
    title: string;
    icon: string;
    link: string;
    available: boolean;
}

export interface GameMenuGroup {
    title: string;
    children: GameMenuItem[];
}
