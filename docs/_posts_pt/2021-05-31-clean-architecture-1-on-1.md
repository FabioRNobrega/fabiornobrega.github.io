---
layout: post
title:  O que é Arquitetura de Software?
date:   2021-05-31 10:00:00 -0300
categories: software
description: A ideia desse artigo pretensioso é me ajudar a fixar determinados assuntos técnicos, e pensar e questionar o livro "Arquitetura Limpa". 
tags: software
author: Fábio R. Nóbrega
continue: Continue lendo
comments: false
read_time: Tempo de leitura
image: 2021-05-31-clean-architecture-1-on-1.jpg
---

A ideia desse artigo pretensioso é me ajudar a fixar determinados assuntos técnicos, a fim de pensar e questionar o livro "Arquitetura Limpa" escrito por Robert C. Martin  em 2017.

Para começarmos essa jornada podemos partir de uma definição quase que “dicionárica”  exposta no livro:  **“arquitetura é a estrutura, que domina os paradigmas e discussões sobre o desenvolvimento de software — componentes, classes, funções, módulos, camadas e serviços, micro ou macro”** , visto dessa forma vemos um resumo bem macro do que seria uma arquitetura e inclusive conseguimos fazer um paralelo com alguns frameworks front end modernos javaScript que utilizam essa mesma nomenclatura. Entretanto, será que uma  coisa realmente tem haver com a outra? Bem, se pensarmos no software como um conjunto total da aplicação e não apenas de um de seus “pedaços”  podemos dizer que não. Mais se pensarmos como algo mais abstrato  assim podemos então dialogar com Grady Booch e pensar que a arquitetura então **“representa as decisões significativas de design que moldam um sistema, onde a significância é medida pelo custo da mudança”**, isto é,  não necessariamente a nomenclatura do seu framework favorito vai determinar sua arquitetura mas sim o seu negócio e decisões vão embasar a mesma.  

A partir disso podemos pensar que a arquitetura deveria ter uma cara e uma estrutura gráfica que poderíamos encaixar alguns blocos e ir construindo um projeto. Infelizmente, mesmo tendo metodologias como MER ou até o próprio UML para linguagens orientadas a objetos é interessante pensar que **“a arquitetura de software não se parece com nada. Uma visualização específica...”**, como as citadas acima, **“é uma escolha, não uma determinação”**. Portanto, a definição mais interessante dita no livro na minha opinião é a de Ralph Johnson , onde **“a arquitetura é o conjunto de decisões que você queria ter tomado logo no início de um projeto, mas, como todo mundo, não teve a imaginação necessária”**, ou seja, decisões desde como sua infraestrutura funciona até como seu back se relaciona com o front, qual linguagem se adéqua mais a solução do seu problema entre outras coisas estão dentro da arquitetura de software. E quanto mais tempo pensamos nelas, mais decisões descobrimos que precisamos tomar antes de dar o primeiro “hello world”. Portanto, a arquitetura se torna como Tom Gilb diz  apenas **“...uma hipótese que precisa ser comprovada por implementação e medição”**, ou seja, o fracasso é uma certeza nosso objetivo como desenvolvedores e líderes de time é pensar em como ser um fracasso contornável. E assim Uncle Bob diz: “Se você me der um programa que funcione perfeitamente, mas seja impossível de mudar, então ele não funcionará quando as exigências mudarem e eu não serei capaz de fazê-lo funcionar. Portanto, o programa será inútil. Se você me der um programa que não funcione, mas seja fácil de mudar, então eu posso fazê-lo funcionar, e posso mantê-lo funcionando à medida que as exigências mudarem. Portanto, o programa permanecerá continuamente útil.”  

Isso nos leva a questionar que a arquitetura prevê tanto novas features como refatorações. Vejo que geralmente queremos ir adicionando novas camadas em nossos projetos e esquecemos as anteriores. Até chegar um momento que é improvável a aplicação se manter em pé caso adicionamos uma nova camada. Isso vai desde de dependências de bibliotecas nossas e externas até mesmo em um simples CSS proprietário muito amarrado à seus componentes específicos. Tudo nos leva a crer que nossa função como desenvolvedor de software é apenas implementar os requisitos e corrigir bugs. Mas na minha opinião devemos ter uma visão global e de entendimento do negócio que nosso projeto se baseia. Para assim podermos estar tomando decisões de arquitetura diariamente e não apenas em um momento de nosso roadmap.

Segundo Uncle bob **“o código continua a ser apenas uma reunião de sequências, seleções e interações, como nos anos 1950 e 1960...”** e **“...essa imutabilidade de código é a razão pela qual as regras de arquitetura de software são tão consistentes entre diversos tipos de sistemas...”** .“Os detalhes de baixo nível e a estrutura de alto nível são partes do mesmo todo”. Ou seja “ A medida  da qualidade do design corresponde à medida do esforço para satisfazer as demandas do cliente. Se o esforço for baixo e se mantiver assim ao longo da vida do sistema, o design é bom. Se o esforço aumentar a cada nova release ou nova versão, o design é ruim. Simples assim”.

Robert finalizar esse primeiro capítulo tando um pequena opção de como fazer essa organização de ideias para  termos uma arquitetura consciente: “Por fim, podemos arranjar esses quatro pares em prioridades:  

```
1. Urgente e importante

2. Não urgente e importante Urgente

3. Não importante e não urgente

4. Não importante
```

**"Note que a arquitetura do código — a coisa importante — está nas duas primeiras posições desta lista, enquanto o comportamento do código ocupa a primeira e terceira posições. O erro que gerentes de negócios e desenvolvedores cometem com frequência elevar os itens na posição 3 para a posição 1. Em outras palavras, eles falham em separar aqueles recursos que são urgentes, mas não são importantes, daqueles que são realmente urgentes e importantes. Essa falha leva, então, a ignorar a importante arquitetura do sistema em favor de recursos não importantes do sistema.”**  - essa metodologia é muito semelhante ao que ficou famoso pelo nome de MoSCoW ( Must Have / Should Have / Could Have / Wouldn’t Have) uma forma de priorização de tarefas que podem ser aplicadas em diferentes contextos.

Para finalizarmos o resumo deste capítulo, **“apenas lembre-se que: se a arquitetura vier por último, então o sistema ficará cada vez mais caro para desenvolver e, por fim, a mudança será praticamente impossível para parte ou para todo o sistema. Se for permitido que isso aconteça, significa que a equipe de desenvolvimento de software não lutou o suficiente pelo que sabiam que era necessário.”**

Sendo assim é importante nesse primeiro capítulo entendermos que arquitetura é algo abstrato, de alto nível e que precisamos estar alicerçados nela antes de começar o projeto e também durante o mesmo. Sendo algo que é código e também negócio.
