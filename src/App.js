import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import Dropdown from "react-bootstrap/Dropdown";

function App() {
  //const hre = require("hardhat");
  const qs = require("qs");
  const Web3 = require("web3");

  const BigNumber = require("bignumber.js");
  const ethers = require("ethers");

  const [logInStatus, updateLogInStatus] = useState(false);
  const [tokenList, updateTokenList] = useState([]);
  const [{ tokenTo, tokenToAddress, tokenToDecimal }, updateTokenTo] =
    useState("");
  const [{ tokenFrom, tokenFromAddress, tokenFromDecimal }, updateTokenFrom] =
    useState("");
  //const [toAmount, UpdateToAmount] = useState("");
  const [sellAmount, updatesellAmount] = useState("");
  const [toAmount, updateToAmount] = useState("Amount");
  const [estimateGas, updateEstimateGas] = useState("");
  //create sign in button for meta mask

  const handleTokenToClick = (token) => {
    updateTokenTo({
      tokenTo: token.symbol,
      tokenToAddress: token.address,
      tokenToDecimal: token.decimals,
    });
    console.log(tokenTo);
    console.log(tokenToAddress);
    console.log(tokenToDecimal);
    //getPrice();
  };

  const handleTokenFromClick = (token) => {
    // event.preventDefault();

    updateTokenFrom({
      tokenFrom: token.symbol,
      tokenFromAddress: token.address,
      tokenFromDecimal: token.decimals,
    });
    console.log(tokenFrom);
    console.log(tokenFromAddress);
    console.log(tokenFromDecimal);
  };

  const handleOnSellAmountChange = (e) => {
    e.preventDefault();
    updatesellAmount(e.target.value);
  };

  async function connectWallet() {
    //await ethereum.request({ method: "eth_requestAccounts" });
    // const ethers = require("ethers");
    let val = await window.ethereum.isConnected();
    if (val) {
      console.log("here");
    }

    updateLogInStatus(true);
  }

  async function listAvailableTokens() {
    let tokens;
    console.log("initializing");
    let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
    let tokenListJSON = await response.json();
    console.log("listing available tokens");
    console.log(tokenListJSON);

    tokens = tokenListJSON.tokens;

    updateTokenList(tokens);
  }

  async function getPrice() {
    console.log("Getting Price");
    // Only fetch price if from token, to token, and from token amount have been filled in
    // The amount is calculated from the smallest base unit of the token. We get this by multiplying the (from amount) x (10 to the power of the number of decimal places)
    let amount = Number(sellAmount * 10 ** tokenFromDecimal);
    console.log(amount);
    const params = {
      sellToken: tokenFromAddress,
      buyToken: tokenToAddress,
      sellAmount: amount,
    };

    const response = await fetch(
      `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );

    let swapPriceJSON = await response.json();
    console.log("Price: ", swapPriceJSON);

    let toAmount = swapPriceJSON.buyAmount / 10 ** tokenToDecimal;
    let estimateGasPrice = swapPriceJSON.estimatedGas;
    console.log(toAmount);
    console.log(estimateGasPrice);
    updateToAmount(toAmount);
    updateEstimateGas(estimateGasPrice);
  }

  async function getQuote(account) {
    console.log("Getting Quote");

    let amount = Number(sellAmount * 10 ** tokenFromDecimal);

    const params = {
      sellToken: tokenFromAddress,
      buyToken: tokenToAddress,
      sellAmount: amount,
      // takerAddress: account,
    };

    // Fetch the swap quote.
    const response = await fetch(
      `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    );

    let swapQuoteJSON = await response.json();
    console.log("Quote: ", swapQuoteJSON);

    let toAmount = swapQuoteJSON.buyAmount / 10 ** tokenToDecimal;
    let estimateGasPrice = swapQuoteJSON.estimatedGas;
    console.log("to amount: ", toAmount);
    console.log("estimated gas price: ", estimateGasPrice);

    return swapQuoteJSON;
  }

  async function trySwap() {
    // The address, if any, of the most recently used account that the caller is permitted to access
    let accounts = await window.ethereum.request({ method: "eth_accounts" });
    let takerAddress = accounts[0];
    // Log the the most recently used address in our MetaMask wallet
    console.log("taker Address: ", takerAddress);

    const provider = new ethers.providers.JsonRpcProvider(
      "https://eth-goerli.g.alchemy.com/v2/N0NVVF7Ds6DPrTPUa7VvIDfpqAbALW13"
    );

    // Pass this as the account param into getQuote() we built out earlier. This will return a JSON object trade order.
    const swapQuoteJSON = await getQuote(takerAddress);
    console.log(swapQuoteJSON);

    const erc20abi = [
      {
        inputs: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "uint256", name: "max_supply", type: "uint256" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "spender",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        name: "Approval",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        inputs: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
        name: "burn",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "account", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "burnFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "subtractedValue", type: "uint256" },
        ],
        name: "decreaseAllowance",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "spender", type: "address" },
          { internalType: "uint256", name: "addedValue", type: "uint256" },
        ],
        name: "increaseAllowance",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "name",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "totalSupply",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    // Set up approval amount for the token we want to trade from
    //const fromToke  nAddress = tokenFromAddress;
    //var contract = new Contract(erc20abi, tokenFromAddress);
    const signer = new ethers.Wallet(
      "78137e6fe6ab933bd9fab36a6e60027096e1b521a929501e9ba898d7def01b80",
      provider
    );
    //const ERC20TokenContract = new ethers.Contract(tokenFromAddress, erc20abi, signer);

    // In order for us to interact with a ERC20 contract's method's, need to create a web3 object. This web3.eth.Contract object needs a erc20abi which we can get from any erc20 abi as well as the specific token address we are interested in interacting with, in this case, it's the fromTokenAddrss
    // Read More: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#web3-eth-contract
    //const web3 = new Web3(Web3.givenProvider);
    // const ERC20TokenContract = new web3.eth.Contract(
    //   erc20abi,
    //   fromTokenAddress
    // );
    const web3 = new Web3(Web3.givenProvider);
    const ERC20TokenContract = new web3.eth.Contract(
      erc20abi,
      tokenFromAddress
    );
    console.log("setup ERC20TokenContract: ", ERC20TokenContract);
    console.log("setup ERC20TokenContract: ", ERC20TokenContract);

    const maxApproval = new BigNumber(2).pow(256).minus(1);
    console.log("approval amount: ", maxApproval);

    const tx = await ERC20TokenContract.methods
      .approve(swapQuoteJSON.allowanceTarget, maxApproval)
      .send({ from: takerAddress })
      .then((tx) => {
        console.log("tx: ", tx);
      });
    

    console.log("tx: ", tx);
    const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
    console.log("receipt: ", receipt);
  }

  useEffect(() => {
    let val = window.ethereum.isConnected();
    if (val) {
      console.log("here");
    } else {
    }
    listAvailableTokens();
    updateLogInStatus(true);
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="/">
          My DEX Aggregator
        </a>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            {!logInStatus ? (
              <button
                id="login_button"
                className="btn btn-outline-primary my-2 my-sm-0"
                type="submit"
                onClick={connectWallet}
              >
                Sign in with MetaMask
              </button>
            ) : (
              <button
                id="login_button"
                className="btn btn-outline-primary my-2 my-sm-0"
                type="submit"
              >
                Hello, Sakal
              </button>
            )}
          </li>
        </ul>
      </nav>
      <div className="container">
        <div className="row">
          <div className="col col-md-6 offset-md-3">
            <h4>Swap</h4>
            <div id="">
              <div className=" d-flex">
                <Dropdown>
                  <Dropdown.Toggle variant="success">
                    {tokenFrom ? tokenFrom : "Select Token"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    style={{
                      maxHeight: "200px",
                      overflowY: "scroll",
                    }}
                  >
                    {tokenList
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((token) => (
                        <Dropdown.Item
                          className="d-flex"
                          key={token.address}
                          eventKey={token.name}
                          onClick={() => handleTokenFromClick(token)}
                          onBlur={getPrice}
                        >
                          <img src={token.logoURI} alt=""></img>
                          <div className="px-2">{token.symbol}</div>
                        </Dropdown.Item>
                      ))}
                  </Dropdown.Menu>
                </Dropdown>
                <div className="swapbox_select">
                  <input
                    className="number form-control"
                    placeholder="amount"
                    onBlur={handleOnSellAmountChange}
                  ></input>
                </div>
              </div>
              <br></br>
              <div className="d-flex">
                <Dropdown>
                  <Dropdown.Toggle variant="success">
                    {tokenTo ? tokenTo : "Select Token"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    style={{
                      maxHeight: "200px",
                      overflowY: "scroll",
                    }}
                  >
                    {tokenList
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((token) => (
                        <Dropdown.Item
                          className="d-flex"
                          key={token.address}
                          eventKey={token.name}
                          onClick={() => handleTokenToClick(token)}
                        >
                          <img src={token.logoURI} alt=""></img>
                          <div className="px-2">{token.symbol}</div>
                        </Dropdown.Item>
                      ))}
                  </Dropdown.Menu>
                </Dropdown>
                <div className="swapbox_select">
                  <input
                    className="number form-control"
                    placeholder={toAmount}
                  ></input>
                </div>
              </div>
              <div className="gas_estimate_label">
                Estimated Gas: <span id="gas_estimate">{estimateGas}</span>
              </div>
              {!logInStatus ? (
                <button
                  className="btn btn-large btn-primary btn-block"
                  id="swap_button"
                >
                  Log in to your account
                </button>
              ) : (
                <button
                  className="btn btn-large btn-primary btn-block"
                  id="swap_button"
                  onClick={trySwap}
                >
                  Swap
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
