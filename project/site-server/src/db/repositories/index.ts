import UserRepository from "./user.repository";
import { HistoryRepository } from "./history.repository";
import { DoorsRepository } from "./doors.repository";
import { CardRepository } from "./card.repository";
import { GameResultRepository } from "./game.result.repository";

export const userRepository = new UserRepository();
export const historyRepository = new HistoryRepository();
export const cardRepository = new CardRepository();
export const doorsRepository = new DoorsRepository();
export const gameResultRepository = new GameResultRepository();

