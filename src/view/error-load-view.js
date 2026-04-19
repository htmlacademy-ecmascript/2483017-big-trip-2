import AbstractView from '../framework/view/abstract-view.js';

function createErrorLoadTemplate() {
  return '<p class="trip-events__msg">Failed to load latest route information</p>';
}

export default class ErrorLoadView extends AbstractView {
  get template() {
    return createErrorLoadTemplate();
  }
}
