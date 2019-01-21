import moment from "moment";
import config from "../config.json";

export default function toMomentTime(time: string) {
	return moment(parseInt(time)).format(config.momentFormat);
}
