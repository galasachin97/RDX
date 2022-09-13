import React from "react";
import "./pagination.scss";
import arrow from "../../assets/images/expand.png";

export default function Pagination(props) {
  const [pageArray, setPageArray] = React.useState([]);
  const [pageNumber, setPageNumber] = React.useState();
  const [RowCount, setRowCount] = React.useState();

  React.useEffect(() => {
    var totPages = parseInt(props.totPages);
    if (totPages.toString().length > 3) {
      let children = document
        .querySelector(".pagination_wrapper")
        .getElementsByTagName("li");
      Array.from(children).forEach((child) => {
        child.style.fontSize = "10px";
      });
    }
    var currentPage = parseInt(props.currentPage);
    setPageNumber(props.currentPage);
    setRowCount(props.rowCount);
    var pageArr = [];
    if (totPages > 1) {
      if (totPages <= 9) {
        var i = 1;
        while (i <= totPages) {
          pageArr.push(i);
          i++;
        }
      } else {
        if (currentPage <= 4)
          pageArr = [1, 2, 3, 4, 5, "", totPages - 1, totPages];
        else if (totPages - currentPage <= 3)
          pageArr = [
            1,
            2,
            "",
            // totPages - 7,
            // totPages - 6,
            totPages - 5,
            totPages - 4,
            totPages - 3,
            totPages - 2,
            totPages - 1,
            totPages,
          ];
        else
          pageArr = [
            1,
            2,
            "",
            // currentPage - 3,
            // currentPage - 2,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            currentPage + 2,
            // currentPage + 3,
            "",
            // totPages - 1,
            totPages,
          ];
      }
    } else {
      pageArr = [totPages];
    }
    setPageArray(pageArr);
  }, [props.totPages, props.currentPage]);

  return (
    <div
      style={{
        ...props.style,
        display: "flex",
        width: "100%",
        justifyContent: "center",
      }}
    >
      <ul className="pagination_wrapper">
        {pageArray.map((ele, ind) => {
          const toReturn = [];
          if (ind === 0) {
            // toReturn.push(
            //   <li
            //     key={"firstpage"}
            //     className="firstpage"
            //     onClick={
            //       props.currentPage === 1
            //         ? () => {}
            //         : () => {
            //             props.pageClicked(1);
            //           }
            //     }
            //   >
            //     {" "}
            //     {"<<"}{" "}
            //   </li>
            // );

            toReturn.push(
              <p
                key={"prevpage"}
                id="prev"
                onClick={
                  props.currentPage === 1
                    ? () => {}
                    : () => {
                        props.pageClicked(props.currentPage - 1, RowCount);
                      }
                }
              >
                {" "}
                {"<"}
              </p>
            );
          }

          if (ele === "") toReturn.push(<li key={ind}>...</li>);
          else
            toReturn.push(
              <li
                key={ind}
                className={Number(props.currentPage) === ele ? "active" : null}
                onClick={
                  props.currentPage === ele
                    ? () => {}
                    : () => {
                        props.pageClicked(ele, RowCount);
                      }
                }
              >
                {ele}
              </li>
            );

          if (ind === pageArray.length - 1) {
            toReturn.push(
              <p
                key="nextpage"
                id="next"
                onClick={
                  props.currentPage === ele
                    ? () => {}
                    : () => {
                        props.pageClicked(props.currentPage + 1, RowCount);
                      }
                }
              >
                {">"}
              </p>
            );

            // toReturn.push(
            //   <li
            //     key={"lastpage"}
            //     onClick={
            //       props.currentPage === ele
            //         ? () => {}
            //         : () => {
            //             props.pageClicked(ele);
            //           }
            //     }
            //   >
            //     {">>"}
            //   </li>
            // );
            toReturn.push(
              <div className="__input_wrapper__">
                <label className="input-label">Go to Page: </label>
                <input
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      props.pageInput(
                        props.rowCount,
                        props.currentPage,
                        pageNumber
                      );
                    }
                  }}
                  value={pageNumber}
                  onChange={(e) => {
                    if (e.target.value > props.totPages) {
                    } else {
                      setPageNumber(e.target.value.replace(/[^0-9]/g, ""));
                    }
                  }}
                  className="page_search"
                  type="text"
                  placeholder="Page No"
                />
                <img
                  src={arrow}
                  className="__arrow__"
                  onClick={() =>
                    props.pageInput(
                      props.rowCount,
                      props.currentPage,
                      pageNumber
                    )
                  }
                  alt="arrow"
                />
              </div>
            );
            toReturn.push(
              <div className="__select_wrapper__">
                <label className="input-label">Show Rows: </label>
                <select
                  value={RowCount}
                  onChange={(e) => {
                    setRowCount(e.target.value);
                    props.handleSelect(props.currentPage, e.target.value);
                  }}
                >
                  <option value="10">10</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            );
          }
          return toReturn;
        })}
        {/* <div className="__input_wrapper__">
          <Dropdown
            optionsList={rowsPerPageArrow}
            handleOption={(data) => setRowsPerPage(data)}
            defaultText={rowsPerPage}
            label="Rows per page:"
          />
        </div> */}
      </ul>
    </div>
  );
}
