import dayjs from 'dayjs';
import { FilterType } from '../const.js';

const filter = {
  [FilterType.EVERYTHING]: (points) => points.filter(() => true),
  [FilterType.FUTURE]: (points) =>
    points.filter((point) => dayjs(point.dateFrom).isAfter(dayjs())),
  [FilterType.PRESENT]: (points) =>
    points.filter((point) => {
      const now = dayjs();
      return !dayjs(point.dateFrom).isAfter(now) && !dayjs(point.dateTo).isBefore(now);
    }),
  [FilterType.PAST]: (points) =>
    points.filter((point) => dayjs(point.dateTo).isBefore(dayjs()))
};

export { filter };
