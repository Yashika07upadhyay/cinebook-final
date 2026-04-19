const Seat = ({ seat, isSelected, onSelect }) => {
  const isBooked = seat.isBooked;
  const isLockedByOther = seat.isLocked && !isSelected;

  let className = "seat";
  if (isBooked) className += " booked";
  else if (isSelected) className += " selected";
  else if (isLockedByOther) className += " locked-other";
  else className += " available";

  const handleClick = () => {
    if (isBooked || isLockedByOther) return;
    onSelect(seat);
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      title={
        isBooked ? `Seat ${seat.seatNumber} – Booked`
        : isLockedByOther ? `Seat ${seat.seatNumber} – Reserved`
        : `Seat ${seat.seatNumber}${isSelected ? " – Selected" : " – Available"}`
      }
    >
      {seat.seatNumber}
    </button>
  );
};

export default Seat;
