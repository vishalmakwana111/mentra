const axios = require("axios");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
dotenv.config();
const express = require("express");
const app = express();
const cors = require("cors");
const { Alchemy, Network } = require("alchemy-sdk");
const OpenAI = require("openai");
// Add WebSocket server
const { Server } = require("ws");
const FormData = require("form-data");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const bcrypt = require("bcrypt");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
app.use(
  cors({
    origin: [
      "https://odessaplus.unclod.com",
      "http://localhost:4177",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies if needed
  })
);

app.options("*", cors()); // Handle preflight requests

app.use(express.json());

// === CONFIG: DeepSeek API ===
// const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// if (!DEEPSEEK_API_KEY) {
//   throw new Error("DEEPSEEK_API_KEY environment variable is required");
// }

// === CONFIG: AWS Polly ===
const polly = new AWS.Polly({
  region: "us-east-1", // or your preferred region
  credentials: {
    accessKeyId: "AKIA6JQ44QJW23K6FP6R",
    secretAccessKey: "YdFKR3/WFtCn3bXlmFkLCEO2ZPUwpYkccBvbbs5x",
  },
});

const s3 = new AWS.S3({
  region: "us-east-1", // or your preferred region
  credentials: {
    accessKeyId: "AKIA6JQ44QJW23K6FP6R",
    secretAccessKey: "YdFKR3/WFtCn3bXlmFkLCEO2ZPUwpYkccBvbbs5x",
  },
});

// === FUNCTION DEFINITIONS ===
const MAX_ITERATIONS = 1;
const TIMEOUT_MS = 10000;

async function getCurrentTime() {
  return { current_time: new Date().toISOString() };
}

async function getWalletConfigurationDetails({ walletAddress }) {
  try {
    const response = await axios.post(
      "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
      {
        operation: "SELECT",
        table: "agent_configurations",
        filters: {
          eq: {
            wallet_address: walletAddress,
          },
        },
      }
    );
    if (response?.data?.[0]) {
      return {
        walletAddress: response?.data?.[0]?.wallet_address,
        maxTradeAmount: response?.data?.[0]?.max_trade_amount,
        stopLoss: response?.data?.[0]?.stop_loss,
        takeProfit: response?.data?.[0]?.take_profit,
        strategyPrompt: response?.data?.[0]?.strategy_prompt,
      };
    }

    return {};
  } catch (error) {
    console.error("Error in getWalletConfigurationDetails:", error);
    return {
      error: "Failed to get wallet configuration details",
      details: error.message,
    };
  }
}

async function predictTradingDecision({ image_url }) {
  try {
    let imageData;

    // Check if the URL is an S3 URL
    if (image_url.includes("amazonaws.com") || image_url.startsWith("s3://")) {
      // Parse the bucket and key from the URL
      let bucket, key;

      if (image_url.startsWith("s3://")) {
        // Handle s3:// format
        const s3Parts = image_url.replace("s3://", "").split("/");
        bucket = s3Parts[0];
        key = s3Parts.slice(1).join("/");
      } else {
        // Handle https://bucket.s3.region.amazonaws.com/key format
        const urlObj = new URL(image_url);
        const hostname = urlObj.hostname;

        if (hostname.includes(".s3.")) {
          bucket = hostname.split(".s3.")[0];
          key = urlObj.pathname.substring(1); // Remove leading slash
        } else {
          // Handle https://s3.region.amazonaws.com/bucket/key format
          const pathParts = urlObj.pathname.split("/").filter((p) => p);
          bucket = pathParts[0];
          key = pathParts.slice(1).join("/");
        }
      }

      console.log(`Getting S3 object from bucket: ${bucket}, key: ${key}`);

      const s3Response = await s3
        .getObject({ Bucket: bucket, Key: key })
        .promise();
      imageData = s3Response.Body;
    } else {
      // For non-S3 URLs, use axios as before
      const imageResponse = await axios.get(image_url, {
        responseType: "arraybuffer",
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
        },
      });
      imageData = imageResponse.data;
    }

    const formData = new FormData();

    // Directly append the Buffer without using Blob
    formData.append("image", Buffer.from(imageData), {
      filename: "screenshot.png",
      contentType: "image/png",
    });

    // return {
    //   final_decision: "BUY_SIGNAL",
    //   patterns_found: ["Pattern 1", "Pattern 2", "Pattern 3"],
    // };

    // Send to prediction service
    const response = await axios.post(
      `http://${process.env.PREDICTION_SERVICE_URL}/predict`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          accept: "application/json",
        },
      }
    );

    return response.data?.final_decision;
  } catch (error) {
    console.error("Error in predictTradingDecision:", error);
    return {
      error: "Failed to predict trading decision",
      details: error.message,
      stack: error.stack,
    };
  }
}

const ethers = require("ethers");

// console.log(
//   executeTradeOnMetamask({
//     walletAddress_: "0xc39032932810cf95285b95ba73a99e28d2ed6a72",
//     token: "ETH",
//     amount: 0.00001,
//     type: "BUY",
//   })
// );

async function executeTradeOnMetamask({ walletAddress_, token, amount, type }) {
  try {
    // console.log("Executing trades:", event.body);
    // const { type, token, amount } = JSON.parse(event.body);

    if (!type || (!token && !amount)) {
      throw new Error("Missing required parameters: type, token, or amount");
    }
    const provider = new ethers.JsonRpcProvider(
      `https://eth-mainnet.g.alchemy.com/v2/azEzby2_WiRH0lTUUl-MgGSRrabdomfD`
    );
    const getWalletConfigurationDetails = await axios.post(
      "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
      {
        operation: "SELECT",
        table: "agent_configurations",
        filters: {
          eq: {
            wallet_address: walletAddress_,
          },
        },
      }
    );
    const walletConfigurationDetails = getWalletConfigurationDetails.data[0];
    if (!walletConfigurationDetails) {
      throw new Error("Wallet configuration details not found");
    }
    if (!walletConfigurationDetails.encrypted_private_key) {
      throw new Error(
        "Wallet configuration details not found, I need to have your private key to make successful trade"
      );
    }
    const decryptedPrivateKey =
      walletConfigurationDetails.encrypted_private_key;
    console.log(
      "Encrypted private key:",
      walletConfigurationDetails.encrypted_private_key
    );

    if (!decryptedPrivateKey) {
      throw new Error("Failed to decrypt private key");
    }
    const signer = new ethers.Wallet(decryptedPrivateKey, provider);
    const walletAddress = await signer.getAddress();

    // Check ETH balance first
    const ethBalance = await provider.getBalance(walletAddress);
    console.log(`Wallet ETH balance: ${ethers.formatEther(ethBalance)} ETH`);
    console.log("type", type, token);
    if (token === "ETH") {
      if (type === "BUY") {
        const UNISWAP_ROUTER_ADDRESS = ethers.getAddress(
          "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        );
        const USDT_ADDRESS = ethers.getAddress(
          "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        );
        const WETH_ADDRESS = ethers.getAddress(
          "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        );

        // Initialize USDT contract
        const usdtContract = new ethers.Contract(
          USDT_ADDRESS,
          [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function balanceOf(address account) external view returns (uint256)",
            "function decimals() external view returns (uint8)",
          ],
          signer
        );

        // Get USDT decimals and format amount
        const decimals = await usdtContract.decimals();
        const amountIn = ethers.parseUnits(amount.toString(), decimals);

        // Check USDT balance
        const usdtBalance = await usdtContract.balanceOf(walletAddress);
        console.log(
          `USDT Balance: ${ethers.formatUnits(usdtBalance, decimals)} USDT`
        );

        if (usdtBalance < amountIn) {
          throw new Error(
            `Insufficient USDT balance. Required: ${amount} USDT, Available: ${ethers.formatUnits(
              usdtBalance,
              decimals
            )} USDT`
          );
        }

        // Check and handle USDT allowance
        const allowance = await usdtContract.allowance(
          walletAddress,
          UNISWAP_ROUTER_ADDRESS
        );
        console.log(
          `Current USDT allowance: ${ethers.formatUnits(
            allowance,
            decimals
          )} USDT`
        );

        if (allowance < amountIn) {
          console.log("Approving USDT...");
          try {
            // First approve 0 to prevent the "infinite approval" security issue
            const resetApproveTx = await usdtContract.approve(
              UNISWAP_ROUTER_ADDRESS,
              0
            );
            await resetApproveTx.wait();
            console.log("Reset approval successful");

            // Now approve the actual amount
            const approveTx = await usdtContract.approve(
              UNISWAP_ROUTER_ADDRESS,
              amountIn
            );
            const approveReceipt = await approveTx.wait();
            console.log("USDT approved. Transaction:", approveReceipt.hash);

            // Verify the new allowance
            const newAllowance = await usdtContract.allowance(
              walletAddress,
              UNISWAP_ROUTER_ADDRESS
            );
            console.log(
              `New USDT allowance: ${ethers.formatUnits(
                newAllowance,
                decimals
              )} USDT`
            );

            if (newAllowance < amountIn) {
              throw new Error("Approval failed - allowance not increased");
            }
          } catch (error) {
            throw new Error(`Failed to approve USDT: ${error.message}`);
          }
        }

        // Initialize Uniswap Router
        const uniswapRouter = new ethers.Contract(
          UNISWAP_ROUTER_ADDRESS,
          [
            "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
            "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)",
          ],
          signer
        );

        // Estimate gas cost
        const gasPrice = await provider
          .getFeeData()
          .then((data) => data.gasPrice);
        const gasEstimate =
          await uniswapRouter.swapExactTokensForETH.estimateGas(
            amountIn,
            0,
            [USDT_ADDRESS, WETH_ADDRESS],
            walletAddress,
            Math.floor(Date.now() / 1000) + 600
          );
        const estimatedGasCost = gasPrice * BigInt(gasEstimate);

        // Check if enough ETH for gas
        if (ethBalance < estimatedGasCost) {
          throw new Error(
            `Insufficient ETH for gas. Required: ${ethers.formatEther(
              estimatedGasCost
            )} ETH, Available: ${ethers.formatEther(ethBalance)} ETH`
          );
        }

        // Execute swap with specific gas settings
        console.log("Executing swap...");
        const tx = await uniswapRouter.swapExactTokensForETH(
          amountIn,
          0,
          [USDT_ADDRESS, WETH_ADDRESS],
          walletAddress,
          Math.floor(Date.now() / 1000) + 600,
          {
            gasLimit: BigInt(Math.ceil(Number(gasEstimate) * 1.1)),
            gasPrice,
          }
        );

        const receipt = await tx.wait();
        console.log("Swap successful! Transaction:", receipt.hash);

        const insertParams = {
          wallet_address: walletAddress_,
          type: type,
          token_symbol: token,
          amount: amount,
          price: amount,
          tx_hash: receipt.hash,
          created_at: new Date().toISOString(),
        };
        const keepWalletTransaction = await axios.post(
          "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
          {
            operation: "INSERT",
            table: "agent_transactions",
            data: insertParams,
          }
        );
      }
      if (type === "SELL") {
        console.log("SELLING ETH");
        const UNISWAP_ROUTER_ADDRESS = ethers.getAddress(
          "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        );
        const USDT_ADDRESS = ethers.getAddress(
          "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        );
        const WETH_ADDRESS = ethers.getAddress(
          "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        );

        // Initialize Uniswap Router contract
        const uniswapRouter = new ethers.Contract(
          UNISWAP_ROUTER_ADDRESS,
          [
            "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
            "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
          ],
          signer
        );

        // Convert ETH amount to Wei
        const amountIn = ethers.parseEther(amount.toString());

        // Check if wallet has enough ETH
        if (ethBalance < amountIn) {
          throw new Error(
            `Insufficient ETH balance. Required: ${amount} ETH, Available: ${ethers.formatEther(
              ethBalance
            )} ETH`
          );
        }

        // Get gas estimate
        const gasEstimate =
          await uniswapRouter.swapExactETHForTokens.estimateGas(
            0, // Accept any amount of tokens
            [WETH_ADDRESS, USDT_ADDRESS],
            walletAddress,
            Math.floor(Date.now() / 1000) + 600,
            {
              value: amountIn,
            }
          );

        const gasPrice = await provider
          .getFeeData()
          .then((fees) => fees.gasPrice);
        const estimatedGasCost = gasPrice * BigInt(gasEstimate);

        // Check if enough ETH for amount + gas
        if (ethBalance < amountIn + estimatedGasCost) {
          throw new Error(
            `Insufficient ETH for amount + gas. Required: ${ethers.formatEther(
              amountIn + estimatedGasCost
            )} ETH, Available: ${ethers.formatEther(ethBalance)} ETH`
          );
        }

        // Execute swap with specific gas settings
        console.log("Executing swap...");
        const tx = await uniswapRouter.swapExactETHForTokens(
          0, // Accept any amount of tokens
          [WETH_ADDRESS, USDT_ADDRESS],
          walletAddress,
          Math.floor(Date.now() / 1000) + 600,
          {
            value: amountIn,
            gasLimit: BigInt(Math.ceil(Number(gasEstimate) * 1.1)),
            gasPrice,
          }
        );

        const receipt = await tx.wait();
        console.log("Swap successful! Transaction:", receipt.hash);

        const insertParams = {
          wallet_address: walletAddress_,
          type: type,
          token_symbol: token,
          amount: amount,
          price: amount,
          tx_hash: receipt.hash,
          created_at: new Date().toISOString(),
        };
        const keepWalletTransaction = await axios.post(
          "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
          {
            operation: "INSERT",
            table: "agent_transactions",
            params: insertParams,
          }
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: "success",
          hash: receipt.hash,
          receipt,
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ status: "error", message: "Invalid trade type" }),
    };
  } catch (error) {
    console.error("Error executing trades:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", message: error.message }),
    };
  }
}

async function getHistoricalTokenPrice({
  tokenSymbol,
  startTime,
  endTime,
  interval,
}) {
  try {
    const options = {
      method: "POST",
      url: "https://api.g.alchemy.com/prices/v1/azEzby2_WiRH0lTUUl-MgGSRrabdomfD/tokens/historical",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      data: {
        symbol: tokenSymbol,
        startTime,
        endTime,
        interval,
      },
    };
    //   console.log("options", options);
    const response = await axios(options);
    return response.data;
  } catch (error) {
    console.error("Error in getHistoricalTokenPrice:", error);
    return JSON.stringify({ error: "Failed to get historical token price" });
  }
}

async function getTokensList() {
  const response = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  const data = await response.json();
  const pairs = data.symbols
    .filter((symbol) => symbol.status === "TRADING")
    .map((symbol) => ({
      symbol: symbol.symbol,
      display: `${symbol.baseAsset}/${symbol.quoteAsset}`,
    }));
  return pairs;
}

async function getWalletTokenPriceDetails({ walletAddress }) {
  try {
    // console.log("Token price request:", event.body);
    // const { wallet_address } = JSON.parse(event.body);

    if (!walletAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: "error",
          message: "Missing wallet address",
        }),
      };
    }

    const settings = {
      apiKey: process.env.ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(settings);
    const balances = await alchemy.core.getTokenBalances(walletAddress);
    const ethBalance = await alchemy.core.getBalance(walletAddress);

    console.log("Balances:", balances);
    console.log("ETH Balance:", ethBalance);

    const tokenData = await Promise.all(
      balances.tokenBalances.map(async (token) => {
        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress
        );
        return {
          ...token,
          ...metadata,
          balance: token.tokenBalance,
        };
      })
    );

    console.log("Token Data:", tokenData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ethBalance: ethBalance.toString(),
        ethBalanceInEther: (Number(ethBalance) / 1e18).toFixed(18),
        balances,
        tokenData,
      }),
    };
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", message: error.message }),
    };
  }
}

async function sendGreestingsHelper({ greetings_reason }) {
  try {
    const completion = openai.chat.completions.create({
      model: "gpt-4o",
      store: true,
      messages: [
        {
          role: "system",
          content:
            "You are a great assistant who always greets me with a great message",
        },
        { role: "user", content: greetings_reason },
      ],
    });
    // const response = await axios.post(
    //   "https://api.deepseek.com/v1/chat/completions",
    //   {
    //     model: "deepseek-chat",
    //     messages: [
    //       {
    //         role: "system",
    //         content:
    //           "You are a great assistant who always greets me with a great message",
    //       },
    //       { role: "user", content: greetings_reason },
    //     ],
    //     stream: false,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );
    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error sending greetings:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", message: error.message }),
    };
  }
}

// === FUNCTION MAPPING ===
const AVAILABLE_SUB_AGENTS = [
  {
    agent_name: "Wallet Configuration Details",
    name: "get_wallet_configuration_details",
    description:
      "I am a sub agent which will help you get the configuration details of a wallet",
    properties: {
      walletAddress: {
        type: "string",
        description: "The address of the wallet",
      },
    },
    function: getWalletConfigurationDetails,
  },
  {
    agent_name: "Greets Helper",
    name: "send_greets_helper",
    description:
      "I am a sub agent which will help you send greetings on behalf of you ",
    properties: {
      greetings_reason: {
        type: "string",
        description:
          "Give a brief of what kind of greetings you want me to give you which you can send to your client",
      },
    },
    function: sendGreestingsHelper,
  },
  {
    agent_name: "Predict Trading Decision",
    name: "predict_trading_decision",
    description:
      "I am a sub agent which will help you predict the trading decision for a given token",
    properties: {
      image_url: {
        type: "string",
        description: "The url of the image of the token candlestick graph",
        required: true,
      },
    },
    function: predictTradingDecision,
  },
  {
    agent_name: "Wallet Token Price Details",
    name: "get_wallet_token_price_details",
    description:
      "I am a sub agent I can only provide you with the details a wallet can have",
    properties: {
      walletAddress: {
        type: "string",
        description: "The address of the wallet",
        required: true,
      },
    },
    function: getWalletTokenPriceDetails,
  },

  {
    agent_name: "Metamask Trade Executer",
    name: "execute_trade_on_metamask",
    description:
      "I am a sub agent I can help you execute a trade on metamask wallet in realtime",
    properties: {
      walletAddress: {
        type: "string",
        description: "The address of the wallet",
        required: true,
      },
      token: {
        type: "string",
        description: "The symbol of the token to trade",
        required: true,
      },
      amount: {
        type: "number",
        description: "The amount of the token to trade",
        required: true,
      },
      type: {
        type: "string",
        description:
          "The type of the trade to execute , either BUY, SELL, or HOLD",
        required: true,
        enum: ["BUY", "SELL", "HOLD"],
      },
    },
    function: executeTradeOnMetamask,
  },
  {
    agent_name: "Historical Crypto Token Price Details",
    name: "get_historical_crypto_token_price",
    description:
      "I am a sub agent which will help you get the historical price of a crypto currency token",
    properties: {
      tokenSymbol: {
        type: "string",
        description: "The symbol of the token to get the historical price of",
        required: true,
      },
      startTime: {
        type: "string",
        description:
          "The start time of the historical price in this format:YYYY-MM-DDTHH:MM:SSZ",
        required: true,
      },
      endTime: {
        type: "string",
        description:
          "The end time of the historical price in this format:YYYY-MM-DDTHH:MM:SSZ",
        required: true,
      },
      interval: {
        type: "string",
        description:
          "The interval of the historical price in this format: 5m, 1h 1d",
        required: true,
      },
    },
    function: getHistoricalTokenPrice,
  },
  {
    agent_name: "dolu",
    name: "get_crypto_tokens_list",
    description:
      "I am a sub agent which will help you get the list of all the crypto currency tokens and their symbols also all the trading pairs",
    properties: {},
    function: getTokensList,
  },
  // {
  //   agent_name: "lolu",
  //   name: "average_numbers",
  //   description:
  //     "This sub agent will help you find the average of the numbers provided",
  //   properties: { numbers: { type: "array", items: { type: "number" } } },
  //   function: averageNumbers,
  // },
  {
    agent_name: "kalu",
    name: "get_current_time",
    description: "I am a sub agent which will help you get the current time",
    properties: {},
    function: getCurrentTime,
  },
];

// === CALL DEEPSEEK MODEL ===
async function callModel(userQuery, executedSubAgents = [], imageUrl = null) {
  const userQueryDef = `
    --------------------- USER QUERY/TASK DETAILS ---------------------

    USER QUERY: "${userQuery}"
    ${imageUrl ? `IMAGE URL: "${imageUrl}"` : ""}
    --------------------- USER QUERY/TASK DETAILS ENDS ---------------------
`;

  const instruction = `
    You are a AI trading expert, who is doing your trades in realtime.
    Your first responsibility is to get and follow the clear instructions stated below.
    The current time is ${new Date().toISOString()}.

    2. Trading Behavior & Execution (Strictly Follow These Instructions)
    - DO NOT ask for user confirmation before executing trades.
    - If the user provides all necessary trade details and ask you to do a trade follow these steps one after another:
      - Check their wallet balance to verify if they can do the trade by BUY or SELL token using the sub agent 'Wallet Token Price Details'.
        example response when you want to check the wallet balance:
        {sub_agent_call: {agent_name: "Wallet Token Price Details", function_call: "get_wallet_token_price_details", properties: {walletAddress: "0x0000000000000000000000000000000000000000"}}}
      - Verify token holdings to ensure the token is available in the wallet.
        example response when you want to verify the token holdings:
        {sub_agent_call: {agent_name: "Wallet Token Price Details", function_call: "get_wallet_token_price_details", properties: {walletAddress: "0x0000000000000000000000000000000000000000"}}}
      - Fetch current market price to determine the optimal trade moment using the sub agent 'Historical Crypto Token Price Details'.
        example response when you want to fetch the current market price:
        {sub_agent_call: {agent_name: "Historical Crypto Token Price Details", function_call: "get_historical_crypto_token_price", properties: {tokenSymbol: "ETH", startTime: "2024-01-01T00:00:00Z", endTime: "2024-01-01T00:00:00Z", interval: "1d"}}}
      - Fetch the wallet configuration details using the sub agent 'Wallet Configuration Details' to know the trading strategy, stop loss, take profit, amount to trade etc.
        example response when you want to fetch the wallet configuration details:
        {sub_agent_call: {agent_name: "Wallet Configuration Details", function_call: "get_wallet_configuration_details", properties: {walletAddress: "0x0000000000000000000000000000000000000000"}}}
      - Get the token BUY/SELL/HOLD decision from the Predict Trading Decision sub agent
      - If all conditions align, execute the trade instantly.
      - Use the Metamask Trade Executer sub-agent to place trades.
        example response when you want to execute the trade:
        {sub_agent_call: {agent_name: "Metamask Trade Executer", function_call: "execute_trade_on_metamask", properties: {walletAddress: "0x0000000000000000000000000000000000000000", token: "ETH", amount: 0.0001, type: "BUY"}}}

    Note:
    - Wallet details just has the details of the wallet, it does not tell you about the status of token in the market now, for that take token price details from other agents or tools
    
    ${
      AVAILABLE_SUB_AGENTS.length > 0
        ? `ALL THE AVAILABLE SUB AGENTS:
    **All The Available Sub Agents Details:** 
    --------------------- available sub agent details starts here ------------------------------

    ${AVAILABLE_SUB_AGENTS.map(
      (fn) => `
      Agent name: ${fn.agent_name}
      Connected function name: ${fn.name}
      Description: ${fn.description}
      Properties: ${JSON.stringify(fn.properties)}
    `
    ).join("\n")}

    --------------------- available sub agent details ends here ------------------------------`
        : ""
    }

        ${
          executedSubAgents.length > 0
            ? `ALREADY EXECUTED SUB AGENTS AND RESULTS OF THE AGENTS, FOR YOUR HELP. TAKE HELP FROM THESE IF YOUR QUERY IS RELATED TO THEM:
    **Executed Sub Agents And Their Responses So Far:** 
    --------------------- sub agent response details starts here --------------------------------

     ${executedSubAgents
       .map(
         (agent) => `
        
      Agent Name: ${agent.agentName}
      Function Name: ${agent.functionName}
      Request Body: ${JSON.stringify(agent.requestBody)}
      Response: ${JSON.stringify(agent.response)}
      `
       )
       .join("\n")} 
    --------------------- sub agent response details ends here --------------------------------
    `
            : ""
        }

    If you have all the information needed from executed functions and response provided, return response
    Otherwise, specify which function to call next in JSON format.

    RESPONSE FORMATS:
    1. When you get information for your query from a sub agent, respond back ONLY with this JSON format, 
    like tell user from which sub agent you want the information:
    {"sub_agent_call": {"agent_name": "sub_agent_name", "function_call": "function_name", "properties": 
    { "key value pairs of the properties you need to pass to the function"}}, "reason": "Give a brief reason about 
     the user query and what are the details you have and why you are calling this sub agent"}
    2. When you have all needed information, respond with this JSON format only:
    {"response": "your detailed response here"}
`;
  // console.log("instruction", instruction);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: instruction,
        },
        {
          role: "user",
          content: userQueryDef,
        },
      ],
      stream: false,
      //   response_format: { type: "json_object" },
    };
    const completion = await openai.chat.completions.create(requestBody);
    // const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
    //   headers: {
    //     Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   // signal: controller.signal,
    // });

    // clearTimeout(timeoutId);
    console.log("response", completion);
    // console.log("response", response.data?.choices[0]?.message?.content);
    // Extract response from DeepSeek format
    let responseText = completion.choices[0]?.message?.content || "";
    console.log("responseText", responseText);
    // Remove any <think> tags and their content
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, "");
    responseText = responseText.replace(/```json\n?|\n?```/g, "").trim();
    return responseText;
  } catch (error) {
    if (error.name === "AbortError") {
      return JSON.stringify({ error: "Request timed out" });
    }
    console.error(
      "Error calling DeepSeek API:",
      error.response?.data || error.message
    );
    return "Error processing your request.";
  }
}

// === HANDLE FUNCTION CALLS (CHAINED EXECUTION) ===
async function handleFunctionCalls(userQuery, ws = null, imageUrl = null) {
  if (!userQuery || typeof userQuery !== "string") {
    throw new Error("Invalid user query");
  }

  let executedFunctions = [];
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    try {
      // Send progress update if WebSocket is available
      if (ws) {
        ws.send(
          JSON.stringify({
            type: "progress",
            message: `Processing iteration ${iterations}...`,
          })
        );
      }

      let nextFunctionCall = await callModel(
        userQuery,
        executedFunctions,
        imageUrl
      );

      while (true) {
        try {
          let responseData = nextFunctionCall;
          if (
            // typeof responseData === "string" &&
            responseData.includes("sub_agent_call")
          ) {
            console.log("responseData", responseData);
            responseData = JSON.parse(nextFunctionCall);
            console.log("responseData", responseData);
          } else {
            const parsed = tryParseJSON(nextFunctionCall);
            return parsed || nextFunctionCall;
          }

          // Validate function call structure
          if (
            !responseData.sub_agent_call ||
            !responseData.sub_agent_call.function_call
          ) {
            throw new Error("Invalid function call format");
          }

          const {
            agent_name,
            function_call,
            properties: props = {},
          } = responseData.sub_agent_call;
          if (ws && responseData.reason) {
            transformIntoAudio(responseData.reason, ws);
          }

          const functionDefinition = AVAILABLE_SUB_AGENTS.find(
            (fn) => fn.name === function_call
          );
          if (functionDefinition) {
            const functionResult = await functionDefinition.function(props);
            console.log("functionResult", functionResult);
            executedFunctions.push({
              agentName: functionDefinition.agent_name,
              functionName: functionDefinition.name,
              requestBody: props,
              response: functionResult,
            }); // Store function result.

            // Ask DeepSeek what to do next with updated history.
            nextFunctionCall = await callModel(
              userQuery,
              executedFunctions,
              imageUrl
            );
            // console.log("nextFunctionCall--->", nextFunctionCall);
          } else {
            return JSON.stringify({
              error: `Sub Agent ${agent_name} not available.`,
            });
          }
        } catch (error) {
          console.error("Error in function execution loop:", error);
          return JSON.stringify({ error: error.message });
        }
      }
    } catch (error) {
      console.error("Error in handleFunctionCalls:", error);
      return JSON.stringify({ error: "Failed to process request" });
    }
  }

  return JSON.stringify({ error: "Maximum iterations reached" });
}

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// Create WebSocket server attached to the Express server
const server = app.listen(3008, () => {
  console.log("Server is running on port 3008");
});

const wss = new Server({ server });

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");

  ws.on("message", async (message) => {
    try {
      const messageString = message.toString();
      console.log("Received message:", messageString);

      const { userQuery, outputFormat, imageUrl } = JSON.parse(messageString);

      // Send initial acknowledgment
      ws.send(
        JSON.stringify({
          type: "status",
          message: "Processing your request...",
        })
      );

      const finalResponse = await handleFunctionCalls(userQuery, ws, imageUrl);

      // Extract text from the response
      let responseText = "";
      if (typeof finalResponse === "string") {
        try {
          const parsed = JSON.parse(finalResponse);
          responseText = parsed.response || parsed.error || finalResponse;
        } catch {
          responseText = finalResponse;
        }
      } else {
        responseText =
          finalResponse.response ||
          finalResponse.error ||
          JSON.stringify(finalResponse);
      }

      if (outputFormat === "text") {
        ws.send(
          JSON.stringify({ type: "response", data: { response: responseText } })
        );
      } else if (outputFormat === "audio") {
        transformIntoAudio(responseText, ws);
      }
    } catch (error) {
      console.error("WebSocket error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process request",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

async function transformIntoAudio(text, ws = null) {
  console.log("transforming text into audio");
  const params = {
    Engine: "neural",
    OutputFormat: "mp3",
    Text: text,
    VoiceId: "Matthew",
    TextType: "text",
  };

  const audioStream = await polly.synthesizeSpeech(params).promise();
  console.log("text transform into audio");
  // Convert audio buffer to base64
  const audioBase64 = audioStream.AudioStream.toString("base64");
  ws.send(
    JSON.stringify({
      type: "audio",
      data: {
        audio: audioBase64,
        contentType: "audio/mpeg",
      },
    })
  );
  console.log("audio sent to client");
}

app.post("/signup", async (req, res) => {
  const { fullName, walletAddress, password } = req.body;

  const checkWalletAddress = await axios.post(
    "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
    {
      operation: "SELECT",
      table: "wallet_users",
      filters: {
        eq: {
          wallet_address: walletAddress,
        },
      },
    }
  );
  if (checkWalletAddress.data.length > 0) {
    res.status(400).json({ error: "User already exists" });
  } else {
    const encryptedPassword = await bcrypt.hash(password, 10);
    const newUser = await axios.post(
      "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
      {
        operation: "INSERT",
        table: "wallet_users",
        params: {
          full_name: fullName,
          wallet_address: walletAddress,
          password: encryptedPassword,
        },
      }
    );
    const token = jwt.sign(
      { wallet_address: walletAddress },
      process.env.AUTH_SECRET_KEY, // Replace with a secure secret key
      { expiresIn: "10m" }
    );
    res.json({
      wallet_address: walletAddress,
      token: token,
      full_name: fullName,
    });
  }
});

app.post("/login", async (req, res) => {
  const { walletAddress, password } = req.body;
  if (!walletAddress || !password) {
    res.status(400).json({ error: "Wallet address and password are required" });
  }
  const userDetails = await axios.post(
    "https://co3wvwskt5.execute-api.ap-south-1.amazonaws.com/Prod/query-db",
    {
      operation: "SELECT",
      table: "wallet_users",
      filters: {
        eq: {
          wallet_address: walletAddress,
        },
      },
    }
  );
  if (userDetails.data.length === 0) {
    res.status(401).json({ error: "User not found" });
  } else if (!(await bcrypt.compare(password, userDetails.data[0].password))) {
    res.status(401).json({ error: "Invalid password" });
  } else {
    const token = jwt.sign(
      { wallet_address: walletAddress },
      process.env.AUTH_SECRET_KEY, // Replace with a secure secret key
      { expiresIn: "10m" }
    );
    res.json({
      wallet_address: walletAddress,
      token: token,
      full_name: userDetails.data[0].full_name,
    });
  }
});
// Keep the existing REST endpoint
app.post("/bot", async (req, res) => {
  try {
    const { userQuery, outputFormat } = req.body;
    const finalResponse = await handleFunctionCalls(userQuery);

    // Extract text from the response
    let responseText = "";
    if (typeof finalResponse === "string") {
      try {
        const parsed = JSON.parse(finalResponse);
        responseText = parsed.response || parsed.error || finalResponse;
      } catch {
        responseText = finalResponse;
      }
    } else {
      responseText =
        finalResponse.response ||
        finalResponse.error ||
        JSON.stringify(finalResponse);
    }

    if (outputFormat == "text") {
      return res.json({ response: responseText });
    }
    if (outputFormat == "audio") {
      // Configure Polly parameters
      const params = {
        Engine: "neural",
        OutputFormat: "mp3",
        Text: responseText,
        VoiceId: "Matthew", // You can choose different voices
        TextType: "text",
      };

      // Generate speech using Polly
      const audioStream = await polly.synthesizeSpeech(params).promise();

      // Set response headers for audio file
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="response.mp3"',
      });

      // Send the audio buffer
      res.send(audioStream.AudioStream);
    }
  } catch (error) {
    console.error("Error generating audio response:", error);
    res.status(500).json({ error: "Failed to generate audio response" });
  }
});

// === MAIN INTERACTIVE LOOP ===
async function agentLoop() {
  console.log("DeepSeek AI Agent is ready! Type 'exit' to stop.");

  while (true) {
    const userInput = await new Promise((resolve) => {
      process.stdout.write("You: ");
      process.stdin.once("data", (data) => resolve(data.toString().trim()));
    });

    if (userInput.toLowerCase() === "exit") {
      console.log("Goodbye!");
      process.exit(0);
    }

    // Step 1: Handle Function Calls Sequentially
    const finalResponse = await handleFunctionCalls(userInput);

    console.log(`Agent: ${JSON.stringify(finalResponse, null, 2)}`);
  }
}

// agentLoop();
