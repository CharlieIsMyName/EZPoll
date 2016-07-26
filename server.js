var express = require('express');
var app=express();
var port=process.env.PORT||8080;
var fs=require("fs");
var bodyParser = require('body-parser');
var url=require("url");
var querystring=require("querystring");
var session=require("client-sessions");

var mongo=require("mongodb");
var monk=require("monk");
var dburl=process.argv[3];  //dburl will be the second argument

const db=monk(dburl);


var myName="helloWorld"

function isValid(str) { return /^\w+$/.test(str); };



app.set("views",__dirname+"/client");
app.set("view engine","jade");

app.use(express.static(__dirname+'/client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  cookieName: "session",
  secret: process.argv[2],            //session secret will be the first argument
  duration: 60*60*1000,               //one hour in length
  activeDuration: 60*60*1000
}));

app.use(function(req,res,next){
  req.db=db;
  next();
})

app.get('/',function(req,res){
  req.db.collection("ezpoll-poll").find({},function(err,data){
    if(err){
      throw err;
    }
    
    
     res.render("index",
    { 
      err: querystring.parse(url.parse(req.url).query).err,
      user: req.session.user,
      pollList: data
    }
    );
  })
 
});

app.get('/signup',function(req,res){
  res.render("signup",
  {
      err: querystring.parse(url.parse(req.url).query).err,
      user: req.session.user
  });
});

app.post('/signup',function(req,res){
  console.log(req.body);
  var loginCollection=req.db.collection("ezpoll-login");
  
  //if the signup input is invalid 
  if(!req.body.username||!req.body.password||!req.body["re-password"]){
    res.redirect("/signup?err=empty");
    return;
  }
  if(req.body.password!=req.body["re-password"]){
    res.redirect("/signup?err=notMatch");
    return;
  }
  if(!isValid(req.body.username)||!isValid(req.body.password)||!isValid(req.body["re-password"])){
    res.redirect("/signup?err=invalid");
    return;
  }
  
  loginCollection.count({"username": req.body.username},function(err,count){
    if(err){
      throw err;
    }
    if(count!=0){
      res.redirect("/signup?err=exist");
      return;
    }
    
    
    loginCollection.insert({
      username: req.body.username,
      password: req.body.password             
    });
    
    req.session.user={
      username: req.body.username
    }
    console.log("yes!");
    res.redirect('/');
    return;
  })
  
  
});

app.get('/signin',function(req,res){
  res.render("signin",
  {
      err: querystring.parse(url.parse(req.url).query).err,
      user: req.session.user
  });
});

app.post('/signin',function(req,res){
  console.log(req.body);
  
  if(!req.body.username||!req.body.password){
    res.redirect("/signin?err=invalid");
    return;
  }
  var loginCollection=req.db.collection("ezpoll-login");
  loginCollection.find({username: req.body.username, password: req.body.password},function(err,data){
    if(err){
      throw err;
    }
    
    if(data.length==0){          //if anything is wrong, login failed
      res.redirect("/signin?err=invalid");
      return;
    }
    
    req.session.user={          //else, login to session and go to the main page
      username: req.body.username
    }
    
    res.redirect('/');
    return;
  });
  
});

app.get('/signout',function(req,res){
  req.session.reset();
  res.redirect('/');
  return;
});

app.get('/newpoll',function(req,res){
  if(!req.session.user){
    res.redirect("/signin");
    return;
  }
  res.render("newpoll",
  {
      err: querystring.parse(url.parse(req.url).query).err,
      user: req.session.user
  });
})

app.post('/newpoll',function(req,res){
  if(!req.session.user){
    res.redirect("/signin");
    return;
  }
  if(!req.body.title){
    res.redirect('/newpoll?err=emptyTitle');
    return;
  }
  
  var i=0;
  var optionList=[];
  
  while(req.body["option"+i]){
    if(req.body["option"+i].trim()){
      var option=req.body["option"+i].trim();
      
      //make sure no duplicated entries
      if(optionList.find(function(data){
        return data.option==option;
      })){
        i++;
        continue;
      }
      
      
      //add to the list
      optionList.push(
        {
          option:option,
          voterIP:[]
        }
      );
    }
    i++;
  }
  
  if(optionList.length<2){
    res.redirect('/newpoll?err=noOption');
    return;
  }
  
  var poll={
    owner: req.session.user.username,
    title: req.body.title,
    optionList: optionList
  }
  
  req.db.collection("ezpoll-poll").insert(poll,function(err,data){
    if(err){
      throw err;
    }
    
    console.log(data);
    res.redirect('/poll?id='+data["_id"]);
  })
  
})

app.get('/poll',function(req,res){
  req.db.collection("ezpoll-poll").find({_id: querystring.parse(url.parse(req.url).query).id},function(err,data){
    if(err){
      throw err;
    }
    if(data.length==0){
      res.redirect('/');
      return;
    }
    
    var isOwner=false;
    if(req.session&&req.session.user&&(req.session.user.username==data[0].owner)){
      isOwner=true;
    }
    
    res.render("poll",
    {
      err: querystring.parse(url.parse(req.url).query).err,
      user: req.session.user,
      poll: data[0],
      isOwner: isOwner
    });
  });
  
});

app.post('/poll',function(req,res){
  var reqip=req.headers['x-forwarded-for'];
  req.db.collection("ezpoll-poll").find({_id:req.body.id},function(err,data){
    if(err){
      throw err;
    }
    
    if(data.length==0){
      res.redirect('/poll?id='+req.body.id+'&err=invalid');
      return;
    }
    
    var optionList=data[0].optionList;
    var index=null;
    for(var i=0;i<optionList.length;i++){
      if(optionList[i].option==req.body.answer){
        index=i;
        break;
      }
    }
    
    if(index==null){
      res.redirect('/poll?id='+req.body.id+'&err=invalid');
      return;
    }
    
    //find if ip voted before. return if already voted(cannot add option either)
    for(i=0;i<optionList.length;i++){
      for(var j=0;j<optionList[i].voterIP.length;j++){
        if(optionList[i].voterIP[j]==reqip){
          res.redirect('/poll?id='+req.body.id+'&err=voted');
          return;
        }
      }
    }
    
    var newOption=req.body.newoption.trim();
    if(newOption){
      optionList.push(
        {
          option: newOption,
          voterIP: [reqip]
        }
      );
      
      req.db.collection("ezpoll-poll").update({_id: req.body.id},{$set:{optionList: optionList}});
      res.redirect("/poll?id="+req.body.id);
      return;
    }
    
    //else append address
    optionList[index].voterIP.push(reqip);
    req.db.collection("ezpoll-poll").update({_id: req.body.id},{$set:{optionList: optionList}});
    res.redirect("/poll?id="+req.body.id);
  })

});

app.get('/mypoll',function(req,res){
  if(req.session&&req.session.user){
    db.collection("ezpoll-poll").find({owner: req.session.user.username},function(err,data){
      if(err){
        throw err;
      }
      
      res.render("index",
      { 
        err: querystring.parse(url.parse(req.url).query).err,
        user: req.session.user,
        pollList: data
      }
      );
      
    });
  }
  else{
    res.redirect('/signin');
    return;
  }
});

app.get('/delete',function(req,res){
   req.db.collection("ezpoll-poll").find({_id: querystring.parse(url.parse(req.url).query).id},function(err,data){
     if(err){
       throw err;
     }
     
      if(data.length==0){   //this should never happen!
        res.redirect('/');
        return;
      } 
      
      if(!(req.session&&req.session.user&&(req.session.user.username==data[0].owner))){ //if not the owner, go to the signin page
        res.render("signin",
        {
            err: querystring.parse(url.parse(req.url).query).err,
            user: req.session.user
        });
        return;
      }
      
      //else delete the poll and go to the index page
      
      req.db.collection("ezpoll-poll").remove({_id: querystring.parse(url.parse(req.url).query).id});
      res.redirect('/');
      return;
   });
});

app.listen(port,function(){
  console.log("the app is listening on port "+port);
});
