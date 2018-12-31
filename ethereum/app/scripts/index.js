// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'
// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import AuctionArtifact from '../../build/contracts/Auction.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
let Auction = contract(AuctionArtifact)
let count = 0;
// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.

$(document).ready(function () {
  if (typeof web3 !== 'undefined') {
  console.log("Using web3 detected from external source like Metamask")
  window.web3 = new Web3(web3.currentProvider);
} else {
  console.warn("No web3 detected ...");
  window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
  Auction.setProvider(web3.currentProvider);
  $('#list').click(function (event) { 
      event.preventDefault();
      $('#products .item').addClass('list-group-item'); 
  });
  $('#grid').click(function (event) { 
      event.preventDefault(); 
      $('#products .item').removeClass('list-group-item'); 
      $('#products .item').addClass('grid-group-item'); 
  });  
  let product_count = 0;
  Auction.deployed().then(function(contractInstance) {
    console.log("writing to transact...");
    contractInstance.getProductNum.call().then(function(v){
      product_count = v;
      for(let i = 0;i < product_count; i++){
        let realIndex = Number(i);
        Auction.deployed.then(function(contractInstance){
          contract.getProduct(realIndex).then(function(result){
            addObj(result[2], result[4], result[3], result[1]/1000000000000000000, result[0]/1000000000000000000,realIndex);
          });
        });
      }
    }).catch(function(err){
      err => {console.warn(err)}
    });
});
});

window.addObj = function(input1, input2, input5, input3, input4, count){
  let products = $('#products');
  let addHtml = '<div class="item  col-xs-4 col-lg-4"><div class="thumbnail"><img class="group list-group-image" src="https://images2.alphacoders.com/979/979175.jpg" alt="" /><div class="caption"><h4 class="group inner list-group-item-heading">';
  addHtml += input1;
  addHtml += '</h4><p class="group inner list-group-item-text">';
  addHtml += input2;
  addHtml += '</p><p class="group inner list-group-item-text">';
  addHtml += input5;
  addHtml += '</p><div class="row"><div class="col-xs-12 col-md-6">';
  addHtml += '<p id="fixed" class="lead">';
  addHtml += '一口价:' + input3;
  addHtml += '</p><p class="lead">';
  addHtml += '竞拍价:' + input4;
  addHtml += '</p></div><div class="col-xs-12 col-md-6 button"><a class="btn btn-success bid ' + count + '" >竞标</a><a class="btn btn-success fixed ' + count + '" >一口价</a></div></div></div></div></div>';
  products.append($(addHtml));

  $('.bid').click( function(event){
    let bidPrice;
    console.log("我真的有来到这里");
    bidPrice = prompt("请输入您的竞标价格:");
    if(bidPrice != null && !(/^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/).test(bidPrice)){
        let index = 1 * $(this).attr("class").trim().split(/\s+/)[3];
        let lead = document.getElementsByClassName('lead');
        lead[index*2+1].innerHTML = '竞拍价: ' + bidPrice;
        let ethPrice = web3.toWei(bidPrice*1, 'ether');
        Auction.deployed().then(function(contractInstance) {
          console.log("writing to transact...");
          contractInstance.bidPrice(index, {from:web3.eth.accounts[0], value:ethPrice}).then(function(v){
            location.reload();
          }).catch(function(err){
            err => {console.warn(err)}
          });
        });
        return ;
    }
    else{
        alert('输入错误');
        return ;
    }
});

$('.fixed').click( function(event){
    let index = 1 * $(this).attr("class").trim().split(/\s+/)[3];
    let lead = document.getElementsByClassName('lead');
    let result = lead[index * 2].innerHTML;
    let price = 1*result.substring(5,result.length-5);
    let ethPrice;
    console.log(price);
    ethPrice = web3.toWei(price,'ether');
    Auction.deployed().then(function(contractInstance) {
      console.log("writing to transact...");
      contractInstance.fixedBuyProduct(index, {from: web3.eth.accounts[0], value:ethPrice}).then(function(v){
        location.reload();
      }).catch(function(err){
        err => {console.warn(err)}
      });
      let items = document.getElementsByClassName('item');
      items[index].parentNode.removeChild(items[index]);
    });
});
};
//弹出隐藏层
window.ShowDiv = function(show_div, bg_div){
  document.getElementById(show_div).style.display='block';
  $("#"+bg_div).height($(document).height());
};
window.ConfirmDiv = function(show_div, bg_div){
  let input1 = $('#input1');
  let input2 = $('#input2');
  let input3 = $('#input3');
  let input4 = $('#input4');
  let input5 = $('#input5');

  let i1 = input1.val();
  let i2 = input2.val();
  let i3 = input3.val();
  let i4 = input4.val();
  let i5 = input5.val();

  if(input1.val() == "" || input2.val() == "" || input3.val() == "" || input4.val() == "" || input5.val() == ""){
      alert("不能含有空字段");
      return ;
  }
  let reg = /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$/;
  if(!(reg.test(input4.val()) == true && reg.test(input3.val()))){
      alert("价格输入格式有误");
      return ;
  }
  if(input3.val()*1 <= input4.val()*1){
      alert('一口价不能小于或等于竞拍价');
      return ;
  }
  Auction.deployed().then(function(contractInstance) {
    //uint _startTime, uint _auctionTime, uint _startingPrice, uint _fixedPrice, string memory _name, string memory _classification, string memory _imageHash, string memory _description
    console.log("开始时间："+ Math.round(new Date() / 1000) + 180);
    console.log("起始价格："+ i4*1);
    console.log("一口价："+ i3*1);
    console.log("名字："+ i1);
    console.log("分类："+ i5);
    console.log("描述："+i2);
    let startPrice = web3.toWei(input4.val()*1, 'ether');
    let fixedPrice = web3.toWei(input3.val()*1, 'ether');
    contractInstance.addProduct(Math.round(new Date() / 1000) + 180, 300, startPrice, fixedPrice, input1.val(), input5.val(), "null", input2.val(), {from: web3.eth.accounts[0]}).then(function(v) {
      location.reload();
    })
    .catch(function(err) {
      err => {console.warn(err)}
    });
});
  let products = $('#products');
  let addHtml = '<div class="item  col-xs-4 col-lg-4"><div class="thumbnail"><img class="group list-group-image" src="https://images2.alphacoders.com/979/979175.jpg" alt="" /><div class="caption"><h4 class="group inner list-group-item-heading">';
  addHtml += input1.val();
  addHtml += '</h4><p class="group inner list-group-item-text">';
  addHtml += input2.val();
  addHtml += '</p><p class="group inner list-group-item-text">';
  addHtml += input5.val();
  addHtml += '</p><div class="row"><div class="col-xs-12 col-md-6">';
  addHtml += '<p id="fixed" class="lead">';
  addHtml += '一口价:' + input3.val();
  addHtml += '</p><p class="lead">';
  addHtml += '竞拍价:' + input4.val();
  addHtml += '</p></div><div class="col-xs-12 col-md-6 button"><a class="btn btn-success bid ' + count + '" >竞标</a><a class="btn btn-success fixed ' + count++ + '" >一口价</a></div></div></div></div></div>';
  products.append($(addHtml));
  $('.bid').click( function(event){
      let bidPrice;
      let ethPrice;
      console.log("我真的有来到这里");
      bidPrice = prompt("请输入您的竞标价格:");
      if(bidPrice != null && !(/^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/).test(bidPrice)){
          let index = 1 * $(this).attr("class").trim().split(/\s+/)[3];
          let lead = document.getElementsByClassName('lead');
          lead[index*2+1].innerHTML = '竞拍价: ' + bidPrice;
          ethPrice = web3.toWei(bidPrice*1, 'ether');
          Auction.deployed().then(function(contractInstance) {
            console.log("writing to transact...");
            contractInstance.bidPrice(index, {from:web3.eth.accounts[0], value:ethPrice}).then(function(v){
            }).catch(function(err){
              err => {console.warn(err)}
            });
          });
          return ;
      }
      else{
          alert('输入错误');
          return ;
      }
  });

  $('.fixed').click( function(event){
      let index = 1 * $(this).attr("class").trim().split(/\s+/)[3];
      let lead = document.getElementsByClassName('lead');
      let result = lead[index * 2].innerHTML;
      let price = 1*result.substring(5,result.length-5);
      let ethPrice;
      console.log(price);
      ethPrice = web3.toWei(price,'ether');
      Auction.deployed().then(function(contractInstance) {
        console.log("writing to transact...");
        contractInstance.fixedBuyProduct(index, {from: web3.eth.accounts[0], value:ethPrice}).then(function(v){
          location.reload();
        }).catch(function(err){
          err => {console.warn(err)}
        });
        let items = document.getElementsByClassName('item');
        items[index].parentNode.removeChild(items[index]);
      });
  });
  
  setTimeout(
    Auction.deployed().then(function(contractInstance) {
      contractInstance.endAuction((count-1)*1, {from: web3.eth.accounts[0]}).then(function(v) {
        location.reload();
      }).catch(function(err){
        err => {console.warn(err)}
      });
    }), 1000*60*5
  );
  input1.val("");
  input2.val("");
  input3.val("");
  input4.val("");
  input5.val("");
  document.getElementById(show_div).style.display='none';
};

//关闭弹出层
window.CloseDiv = function(show_div, bg_div){
  let input1 = $('#input1');
  let input2 = $('#input2');
  let input3 = $('#input3');
  let input4 = $('#input4');
  let input5 = $('#input5');
  input1.val("");
  input2.val("");
  input3.val("");
  input4.val("");
  input5.val("");
  document.getElementById(show_div).style.display='none';
};