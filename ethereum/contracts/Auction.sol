pragma solidity ^0.4.23;

import "./Migrations.sol";

contract Auction{
    struct Product{
        uint ID; // product id
        uint startTime; // the time that product start to be sold
        uint auctionTime; // the length of the auction time
        uint startingPrice; // 起拍价
        uint fixedPrice; // 一口价
        uint topPrice; // 当前最高价
        uint bidNumber; // 竞拍人数
        string name; // product name
        string classification; // product class
        string imageHash; // product image hash value
        string description; // product description
        address buyer; // 出价最高的投标人地址
        address belongTo; // 商品归属信息
        Status status; // product status
    }

    enum Status{
        AVAILABLE, // 可竞标
        SOLD, // 拍卖结束，已售出
        UNSOLD // 拍卖结束，未售出
    }
    uint productCount;
    mapping(uint => Product) store; // 商品id到商品的映射
    mapping(uint => mapping(uint => address)) public bidders; // 商品id到竞拍者的映射
    mapping(address => mapping(uint => uint)) public biddersPrice; // 竞拍者对每件商品的出价
    
    constructor() public{
        productCount = 0;
    }

    function addProduct(uint _startTime, uint _auctionTime, uint _startingPrice, uint _fixedPrice, string memory _name, string memory _classification, string memory _imageHash, string memory _description) public{
        Product memory product = Product(productCount, _startTime, _auctionTime, _startingPrice, _fixedPrice, _startingPrice, 0, _name, _classification, _imageHash, _description, 0, msg.sender, Status.AVAILABLE);
        store[productCount] = product;
        productCount++;
    }

    function bidProduct(uint _productID)public payable returns(bool){
        Product storage product = store[_productID];
        require(block.timestamp <= product.startTime + product.auctionTime, "竞拍结束");
        require(product.status == Status.AVAILABLE, "不存在该商品");
        require(msg.value < product.fixedPrice, "竞拍价大于或等于一口价，你是傻子吗");
        require(msg.value >= product.topPrice, "竞拍价格不得低于当前竞拍最高价");
        product.topPrice = msg.value;
        product.buyer = msg.sender;
        bidders[_productID][product.bidNumber] = msg.sender;
        product.bidNumber++;
        biddersPrice[msg.sender][_productID] = msg.value;
        return true;
    }

    function fixedBuyProduct(uint _productID)public payable returns(bool) {
        Product storage product = store[_productID];
        require(block.timestamp <= product.startTime + product.auctionTime, "竞拍已结束");
        require(product.status == Status.AVAILABLE, "不存在该商品");
        product.topPrice = product.fixedPrice;
        product.buyer = msg.sender;
        bidders[_productID][product.bidNumber] = msg.sender;
        product.bidNumber++;
        biddersPrice[msg.sender][_productID] = product.fixedPrice;
        endAuction(_productID);
        return true;
    }

    function endAuction(uint _productID) public{
        Product storage product = store[_productID];
        address temp;
        uint price;
        uint i;
        if((block.timestamp <= product.startTime + product.auctionTime) && product.topPrice == product.fixedPrice){ // 一口价买下商品
            for(i=0;i<product.bidNumber;i++){
                if(biddersPrice[bidders[_productID][i]][_productID] != product.fixedPrice){
                    temp = bidders[_productID][i];
                    price = biddersPrice[temp][_productID];
                    temp.transfer(price);
                }
                else{
                    product.status = Status.SOLD;
                    product.belongTo.transfer(product.fixedPrice);
                    product.belongTo = bidders[_productID][i];
                }
            }
        }
        else if((block.timestamp > product.startTime + product.auctionTime) && product.status == Status.AVAILABLE && product.belongTo != product.buyer){
            for(i=0;i<product.bidNumber;i++){
                if(biddersPrice[bidders[_productID][i]][_productID] != product.topPrice){
                    temp = bidders[_productID][i];
                    price = biddersPrice[temp][_productID];
                    temp.transfer(price);
                }
                else{
                    product.status = Status.SOLD;
                    product.belongTo.transfer(product.topPrice);
                    product.belongTo = bidders[_productID][i];
                }
            }
        }
        else if((block.timestamp > product.startTime + product.auctionTime) && product.status == Status.AVAILABLE && product.buyer == product.belongTo){
            product.status = Status.UNSOLD;
        }
        else{
            require((block.timestamp > product.startTime + product.auctionTime),"反正就是失败了");
        }
    }
// 当前最高价、一口价、名字、分类、描述、状态
function getProduct(uint _productID) public view returns(uint, uint, string, string, string, Status){
    Product memory product = store[_productID];
    return (product.topPrice, product.fixedPrice, product.name, product.classification, product.description, product.status);
}
function getBuyer(uint _productID) public view returns(address) {
    Product memory product = store[_productID];
    return product.buyer;
}
function belongToWho(uint _productID) public view returns(address) {
    Product memory product = store[_productID];
    return product.belongTo;
}
function getProductNum() public view returns(uint) {
    return productCount;
}
}