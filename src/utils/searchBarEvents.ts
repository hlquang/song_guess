let suppressed = false;

export const suppressSearchClose = () => {
  suppressed = true;
};

export const consumeSearchCloseSuppression = () => {
  const was = suppressed;
  suppressed = false;
  return was;
};
