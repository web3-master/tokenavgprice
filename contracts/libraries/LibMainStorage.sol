// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BokkyPooBahsDateTimeLibrary.sol";

library LibMainStorage {
    bytes32 constant MAIN_STORAGE_POSITION = keccak256("tokenavgprice.mainstorage");

    struct MainStorage {
        mapping(uint => uint) dailyPrices;
        mapping(uint => bool) dailyPriceExistance;
    }

    function getMainStorage() internal pure returns (MainStorage storage s) {
        bytes32 position = MAIN_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function setDailyPrice(uint dayTimestamp, uint price) internal {
        MainStorage storage s = getMainStorage();
        s.dailyPrices[dayTimestamp] = price;
        s.dailyPriceExistance[dayTimestamp] = true;
    }

    function getDailyPrice(uint dayTimestamp) internal view returns (uint) {
        MainStorage storage s = getMainStorage();
        return s.dailyPrices[dayTimestamp];
    }

    function getAvgPrice(uint fromTimestamp, uint toTimestamp) internal view returns (uint) {
        MainStorage storage s = getMainStorage();
        uint totalPrice = 0;
        uint totalDays = 0;
        for (uint timestamp = fromTimestamp; timestamp <= toTimestamp; timestamp += BokkyPooBahsDateTimeLibrary.SECONDS_PER_DAY) {
            totalPrice += s.dailyPrices[timestamp];
            if (s.dailyPriceExistance[timestamp] == true) {
                totalDays ++;
            }
        }

        if (totalDays == 0) {
            return 0;
        }

        return totalPrice / totalDays;
    }
}