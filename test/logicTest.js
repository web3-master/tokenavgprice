const {
    getSelectors,
    FacetCutAction,
  } = require('../scripts/libraries/diamond.js')
  
  const { deployDiamond } = require('../scripts/deploy.js')
  
  const { assert } = require('chai')
  
  describe('Versions Logic Test', async function () {
    let diamondAddress
    let diamondCutFacet
    let diamondLoupeFacet
    let tx
    let receipt
    let result
    const addresses = []
  
    const dailyPrices = []
    var avgPrice = 0
  
    before(async function () {
      diamondAddress = await deployDiamond()
      diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
      diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  
      //
      // Prepare test data set.
      //
      const startDate = new Date('2021/6/1');
      const endDate = new Date('2021/10/31');
      const avgStartDate = new Date('2021/8/1');
      const avgEndDate = new Date('2021/9/30');
      var avgSum = 0;
      var avgDays = 0;
      let loop = new Date(startDate);
      while (loop <= endDate) {
        let randomPrice = Math.round(Math.random() * 10000);
        dailyPrices[loop.getTime()] = randomPrice;
  
        if (avgStartDate <= loop && loop <= avgEndDate) {
          avgDays ++;
          avgSum += randomPrice;
        }
  
        let newDate = loop.setDate(loop.getDate() + 1);
        loop = new Date(newDate);
      }
  
      avgPrice = Math.floor(avgSum / avgDays);
      console.log('Test data average price is %d', avgPrice);
    })
  
    it('Add Version1 test', async () => {
      const Version1Facet = await ethers.getContractFactory('Version1Facet')
      const version1Facet = await Version1Facet.deploy()
      await version1Facet.deployed()
      addresses.push(version1Facet.address)
      const selectors = getSelectors(version1Facet)
      tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: version1Facet.address,
          action: FacetCutAction.Add,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
      receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
      }
      result = await diamondLoupeFacet.facetFunctionSelectors(version1Facet.address)
      assert.sameMembers(result, selectors)
    })
  
    it('Version1 set & get test', async () => {
      const version1Facet = await ethers.getContractAt('Version1Facet', diamondAddress)
  
      for (var timestamp in dailyPrices) {
        let date = new Date(Number(timestamp));
        let price = dailyPrices[timestamp];
  
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
  
        tx = await version1Facet.setPrice(year, month, day, price);
        await tx.wait();
        result = await version1Facet.getPrice(year, month, day);
        assert.equal(result, price);
      };
    })
  
    it('Version1 get average test', async () => {
      const version1Facet = await ethers.getContractAt('Version1Facet', diamondAddress)
      result = await version1Facet.getAvgPrice(2021, 8, 1, 2021, 9, 30);
      console.log('Version1 average price is ', result.toNumber());
      assert.equal(result, avgPrice);
    })
  
    it('Upgrade Version1 to Version2 test', async () => {
      const Version2Facet = await ethers.getContractFactory('Version2Facet')
      const version2Facet = await Version2Facet.deploy()
      await version2Facet.deployed()
      const selectors = getSelectors(version2Facet)
  
      tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: version2Facet.address,
          action: FacetCutAction.Replace,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
      receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
      }
      result = await diamondLoupeFacet.facetFunctionSelectors(version2Facet.address)
      assert.sameMembers(result, selectors)
    })
  
    it('Version2 get average test', async () => {
      const version2Facet = await ethers.getContractAt('Version2Facet', diamondAddress)
      result = await version2Facet.getAvgPrice(2021, 8, 1, 2021, 9, 30);
      console.log('Version2 average price is ', result.toNumber());
      assert.equal(result, avgPrice);
    })
  
    it('Version2 set price by owner test', async () => {
      const [owner] = await ethers.getSigners();
      console.log('Owner address: ' + owner.address);
  
      const version2Facet = await ethers.getContractAt('Version2Facet', diamondAddress)
  
      tx = await version2Facet.connect(owner).setPrice(2020, 1, 1, 101);
      await tx.wait();
      result = await version2Facet.getPrice(2020, 1, 1);
      assert.equal(result, 101);
    })
  
    it('Version2 set price by non-owner test', async () => {
      const [_, addr1] = await ethers.getSigners();
      console.log('Caller address: ' + addr1.address);
  
      const version2Facet = await ethers.getContractAt('Version2Facet', diamondAddress)
  
      try {
        result = await version2Facet.connect(addr1).setPrice(2020, 1, 2, 102);
        assert.fail();
      } catch (error) {
        console.log('setPrice() is reverted with message:\n', error.message);
        assert(error.message.includes('LibDiamond: Must be contract owner'));
      }
    })
  
    it('Upgrade Version2 to Version3 test', async () => {
      const Version3Facet = await ethers.getContractFactory('Version3Facet')
      const version3Facet = await Version3Facet.deploy()
      await version3Facet.deployed()
      const selectors = getSelectors(version3Facet)
  
      tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: version3Facet.address,
          action: FacetCutAction.Replace,
          functionSelectors: selectors
        }],
        ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
      receipt = await tx.wait()
      if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
      }
      result = await diamondLoupeFacet.facetFunctionSelectors(version3Facet.address)
      assert.sameMembers(result, selectors)
    })
  
    it('Version3 set today\'s price test', async () => {
      const [owner] = await ethers.getSigners();
      console.log('Owner address: ' + owner.address);
  
      const today = new Date();
      console.log('Today is ', today);
  
      const todayYear = today.getUTCFullYear();
      const todayMonth = today.getUTCMonth() + 1;
      const todayDate = today.getUTCDate();
  
      const version3Facet = await ethers.getContractAt('Version3Facet', diamondAddress)
  
      tx = await version3Facet.connect(owner).setPrice(todayYear, todayMonth, todayDate, 200);
      await tx.wait();
      result = await version3Facet.getPrice(todayYear, todayMonth, todayDate);
      assert.equal(result, 200);
    })
  
    it('Version3 set non-today\'s price test', async () => {
      const [owner] = await ethers.getSigners();
      console.log('Owner address: ' + owner.address);
  
      const testDay = new Date(Date.UTC(2022, 0, 1));
      console.log('Test day is ', testDay);
  
      const testDayYear = testDay.getUTCFullYear();
      const testDayMonth = testDay.getUTCMonth() + 1;
      const testDayDate = testDay.getUTCDate();
  
      const version3Facet = await ethers.getContractAt('Version3Facet', diamondAddress)
  
      try {
        await version3Facet.connect(owner).setPrice(testDayYear, testDayMonth, testDayDate, 200);
        assert.fail();
      } catch (error) {
        console.log('setPrice() is reverted with message:\n', error.message);
        assert(error.message.includes('The price can be set on the same day itself.'));
      }
    })
  })
  