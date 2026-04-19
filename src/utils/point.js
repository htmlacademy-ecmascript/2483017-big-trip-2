import dayjs from 'dayjs';

const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 1440;
const DATE_FORMAT = 'MMM DD';
const TIME_FORMAT = 'HH:mm';
const TRIP_MONTH_DAY_FORMAT = 'DD MMM';

function humanizeEventDate(date, format = DATE_FORMAT) {
  return date ? dayjs(date).format(format).toUpperCase() : '';
}

function humanizeTime(date) {
  return date ? dayjs(date).format(TIME_FORMAT) : '';
}

function humanizeTripDates(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) {
    return '';
  }

  const startDate = dayjs(dateFrom);
  const endDate = dayjs(dateTo);

  return `${startDate.format(TRIP_MONTH_DAY_FORMAT)} — ${endDate.format(TRIP_MONTH_DAY_FORMAT)}`;
}

function humanizeDuration(dateFrom, dateTo) {
  const diffInMinutes = dayjs(dateTo).diff(dayjs(dateFrom), 'minute');

  if (diffInMinutes < MINUTES_IN_HOUR) {
    return `${diffInMinutes}M`;
  }

  if (diffInMinutes < MINUTES_IN_DAY) {
    const hours = Math.floor(diffInMinutes / MINUTES_IN_HOUR);
    const minutes = diffInMinutes % MINUTES_IN_HOUR;

    return `${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
  }

  const daysCount = Math.floor(diffInMinutes / MINUTES_IN_DAY);
  const restHoursCount = Math.floor((diffInMinutes % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
  const restMinutesCount = diffInMinutes % MINUTES_IN_HOUR;

  return `${String(daysCount).padStart(2, '0')}D ${String(restHoursCount).padStart(2, '0')}H ${String(restMinutesCount).padStart(2, '0')}M`;
}

function sortPointDay(pointA, pointB) {
  return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
}

function sortPointTime(pointA, pointB) {
  const durationPointA = dayjs(pointA.dateTo).diff(dayjs(pointA.dateFrom));
  const durationPointB = dayjs(pointB.dateTo).diff(dayjs(pointB.dateFrom));

  return durationPointB - durationPointA;
}

function sortPointPrice(pointA, pointB) {
  return pointB.basePrice - pointA.basePrice;
}

function isDatesEqual(dateA, dateB) {
  return dayjs(dateA).isSame(dayjs(dateB));
}

export { humanizeEventDate, humanizeTime, humanizeTripDates, humanizeDuration, sortPointDay, sortPointTime, sortPointPrice, isDatesEqual };
