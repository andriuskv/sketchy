import { type ChangeEvent } from "react";
import Icon from "components/Icon/Icon";
import Dropdown from "components/Dropdown/Dropdown";
import "./Sort.css";

type Props = {
  sortOptions: {
    sortBy: string,
    sortOrder: number
  },
  sortImages: (sortBy: string, sortOrder?: number) => void
}

export default function Sort({ sortOptions, sortImages }: Props) {
  const { sortBy, sortOrder } = sortOptions;

  function changeSortOrder({ target }:ChangeEvent<HTMLInputElement>) {
    sortImages(sortBy, Number(target.value));
  }

  return (
    <Dropdown
      toggle={{
        body: (
          <>
            <Icon id="sort"/>
            <span>Sort</span>
          </>
        ),
        className: "icon-text-btn sort-dropdown-toggle-btn"
      }}
      container={{ className: "sort-dropdown-container" }}>
      <div className="dropdown-group">
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${sortBy === "default" ? " active" : ""}`}
          onClick={() => sortImages("default")}>Default</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${sortBy === "name" ? " active" : ""}`}
          onClick={() => sortImages("name")}>Name</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${sortBy === "date" ? " active" : ""}`}
          onClick={() => sortImages("date")}>Date</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${sortBy === "size" ? " active" : ""}`}
          onClick={() => sortImages("size")}>Size</button>
      </div>
      <div className="dropdown-group">
        <label className="dropdown-btn radio-container sort-dropdown-radio">
          <input type="radio" className="sr-only radio-input"
            name="sortOrder" value="1"
            onChange={changeSortOrder}
            checked={sortOrder === 1}/>
          <div className="radio"></div>
          <span className="radio-label">Ascending</span>
        </label>
        <label className="dropdown-btn radio-container sort-dropdown-radio">
          <input type="radio" className="sr-only radio-input"
            onChange={changeSortOrder}
            name="sortOrder" value="-1"
            checked={sortOrder === -1}/>
          <div className="radio"></div>
          <span className="radio-label">Descending</span>
        </label>
      </div>
    </Dropdown>
  );
}
