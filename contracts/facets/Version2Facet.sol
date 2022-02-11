// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/BokkyPooBahsDateTimeLibrary.sol";
import "../libraries/LibMainStorage.sol";
import "../libraries/LibDiamond.sol";
import "hardhat/console.sol";

contract Version2Facet {

    ///
    /// @notice Set token price of some day. For example, setPrice(2022, 1, 1, 1000)
    /// Attention: Only contract owner can set the price.
    ///
    function setPrice(uint year, uint month, uint day, uint price) external {
        LibDiamond.enforceIsContractOwner();
        console.log("Version2Facet.setPrice(%d, %d, %d) called.", year, month, day);

        require(BokkyPooBahsDateTimeLibrary.isValidDate(year, month, day), 'Invalid date.');

        uint timestamp = BokkyPooBahsDateTimeLibrary.timestampFromDate(year, month, day);

        LibMainStorage.setDailyPrice(timestamp, price);
    }

    ///
    /// @notice Get token price of some day. For example, getPrice(2022, 1, 1)
    ///
    function getPrice(uint year, uint month, uint day) external view returns (uint) {
        console.log("Version2Facet.getPrice(%d, %d, %d) called.", year, month, day);

        require(BokkyPooBahsDateTimeLibrary.isValidDate(year, month, day), 'Invalid date.');

        uint timestamp = BokkyPooBahsDateTimeLibrary.timestampFromDate(year, month, day);

        return LibMainStorage.getDailyPrice(timestamp);
    }

    ///
    /// @notice Get average token price of some duration. For example, getAvgPrice(2021, 8, 1, 2021, 9, 30)
    ///
    function getAvgPrice(uint fromYear, uint fromMonth, uint fromDay, uint toYear, uint toMonth, uint toDay) external view returns (uint) {
        console.log("Version2Facet.getAvgPrice() called.");
        console.log("From: %d, %d, %d", fromYear, fromMonth, fromDay);
        console.log("To: %d, %d, %d", toYear, toMonth, toDay);

        require(BokkyPooBahsDateTimeLibrary.isValidDate(fromYear, fromMonth, fromDay), 'Invalid from date.');
        require(BokkyPooBahsDateTimeLibrary.isValidDate(toYear, toMonth, toDay), 'Invalid to date.');

        uint fromTimestamp = BokkyPooBahsDateTimeLibrary.timestampFromDate(fromYear, fromMonth, fromDay);
        uint toTimestamp = BokkyPooBahsDateTimeLibrary.timestampFromDate(toYear, toMonth, toDay);

        return LibMainStorage.getAvgPrice(fromTimestamp, toTimestamp);
    }
}
