/* Writing prompts. Task 1 visuals are drawn from data (figures are invented for practice). */
App.data.writing1 = [
{ id:'w1a', title:'Household internet access', kind:'Line graph',
  prompt:'The graph below shows the percentage of households with internet access in three countries between 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  chart:{ type:'line', title:'Households with internet access (%)', unit:'%', x:['2000','2004','2008','2012','2016','2020'],
    series:[{name:'Sweden',values:[25,52,71,83,90,96]},{name:'Mexico',values:[5,14,30,45,61,81]},{name:'Indonesia',values:[1,4,12,27,48,70]}] }},
{ id:'w1b', title:'Leisure time by age group', kind:'Bar chart',
  prompt:'The chart below shows the average number of hours per week that people in different age groups spent on four leisure activities in one country in 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  chart:{ type:'bar', title:'Average hours per week on leisure activities, 2023', unit:'hours', cats:['16–24','25–44','45–64','65+'],
    series:[{name:'Social media',values:[14,9,5,2]},{name:'Watching TV',values:[6,9,13,20]},{name:'Exercise',values:[5,4,3,3]},{name:'Reading',values:[2,3,5,8]}] }},
{ id:'w1c', title:'Household spending 1995 vs 2025', kind:'Table',
  prompt:'The table below shows the proportion of household income spent on different categories in one country in 1995 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  chart:{ type:'table', title:'Share of household income spent (%)', cols:['Category','1995','2025'],
    rows:[['Housing',24,35],['Food',30,16],['Transport',12,14],['Education',8,13],['Leisure',6,11],['Other',20,11]] }},
{ id:'w1d', title:'How recycled paper is made', kind:'Process diagram',
  prompt:'The diagram below shows the process of producing recycled paper.\n\nSummarise the information by selecting and reporting the main features.',
  chart:{ type:'process', title:'Producing recycled paper', steps:['Waste paper is collected from homes and offices','Paper is sorted by type and grade','Paper is soaked in water and chemicals to form pulp','Ink is removed with air bubbles (de-inking)','Pulp is cleaned and screened','Pulp may be bleached','Pulp is pressed and rolled into sheets','Sheets are dried on heated rollers','Paper is cut and delivered to shops'] }}
];

App.data.writing2 = [
{ id:'t1', kind:'Opinion', topic:'Education', prompt:'Some people believe that unpaid community service should be a compulsory part of high school programmes (for example, working for a charity, improving the neighbourhood or teaching sports to younger children).\n\nTo what extent do you agree or disagree?' },
{ id:'t2', kind:'Discussion', topic:'Crime', prompt:'Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime.\n\nDiscuss both views and give your own opinion.' },
{ id:'t3', kind:'Advantages / disadvantages', topic:'Work', prompt:'In many countries, more and more people are choosing to work from home.\n\nDo the advantages of this development outweigh the disadvantages?' },
{ id:'t4', kind:'Problem / solution', topic:'Cities & Transport', prompt:'In many cities around the world, traffic congestion is becoming a serious problem.\n\nWhat are the causes of this problem, and what measures could be taken to solve it?' },
{ id:'t5', kind:'Two-part question', topic:'Technology', prompt:'Many young people today spend several hours a day on social media.\n\nWhy is this the case? Is this a positive or negative development?' },
{ id:'t6', kind:'Opinion', topic:'Government spending', prompt:'Governments should spend money on railways rather than roads.\n\nTo what extent do you agree or disagree with this statement?' },
{ id:'t7', kind:'Discussion', topic:'Education', prompt:'Some people believe that the main purpose of universities is to provide academic knowledge, while others think universities should prepare students for employment.\n\nDiscuss both views and give your own opinion.' },
{ id:'t8', kind:'Opinion', topic:'Environment', prompt:'Climate change is the responsibility of governments and large companies, not individuals.\n\nTo what extent do you agree or disagree?' },
{ id:'t9', kind:'Advantages / disadvantages', topic:'Family', prompt:'Nowadays, many people choose to have children later in life.\n\nWhat are the advantages and disadvantages of this trend?' },
{ id:'t10', kind:'Two-part question', topic:'Society', prompt:'In some countries, the number of people living alone is increasing.\n\nWhat are the reasons for this? Is it a positive or negative development?' }
];
