import { DirectMessage } from "./message.model";

export class DirectMessageThread {
    public constructor(public messages: DirectMessage[]) {}

    public static fromDto(dto: unknown): DirectMessageThread {
        return new DirectMessageThread(DirectMessage.fromList(dto));
    }
}
