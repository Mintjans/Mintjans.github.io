//Variaveis globais mt mt importantes
/*
    passo_pra_tras, salva o caminho para o csv anterior pra poder retornar o grafico
    degrau salva em que nivel de hierarquia(ou geração se vc quiser pensar em nodes filhos) estamos(perceba que na realidade os dados tem uma estrutura de arvore)
    0=raiz
    2=galho
    3=folha
 */
var passo_pra_tras = []
var degrau = 0

//Funções pra usar no futuro
/*
    sleep usado pra controlar o flow do programa
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/*
    colunaCor e colunaNome leem o csv e retornam uma lista com os nomes e as cores de cada materia, usar com o await pra dar prioridade a função
 */
async function colunaCor(caminho) {
    var listacor = []

    await d3.csv(caminho, function(data) {
        if (data.cor != "NULL") {
            listacor.push(data.cor)
        }
    })
    return listacor
}
async function colunaNome(caminho) {
    var listanome = []

    await d3.csv(caminho, function(data) {
        listanome.push(data.nome)
    })

    return listanome
}

/*
    pegaMax e pegaMin leem o csv e retornam uma lista com o tamanho maximo e minimo do csv, usar com o await pra dar prioridade a função
 */
async function pegaMax(caminho) {
    var valorMax = 0
    var i = 0

    await d3.csv(caminho, function(data) {
        if (i > 0) {
            if (+data.tamanho > +valorMax) {               
                valorMax = data.tamanho
            }
        }else{
            valorMax = data.tamanho
        }
        i++
    })

    return valorMax
}
async function pegaMin(caminho) {
    var valorMin = 0
    var i = 0

    await d3.csv(caminho, function(data) {
        if (i > 0) {
            if (+data.tamanho < +valorMin) {
                valorMin = data.tamanho
            }
        }else{
            valorMin = data.tamanho
        }

        i++
    })

    return valorMin
}

/*
    transicaoDeAvanco e transicaoDeVolta são as funções que realizam as animações de transição do d3 e chamam fazerBolotas ou fazerLinks pra carregar o grafico ou pagina nova
 */
async function transicaoDeAvanco(dado, tamanho, caminho_save) {
    /*aqui eu tenho q pegar a bolota especifica q foi clickada e:
    1º aumentar o tamanho dela até a tela inteira ser ela
    2º mudar a da bola(que agr é a tela) para #1B2631
    3º chamar a função pra desenhar o proximo gráfico
    */
    //definir como degrau 3(folhas) caso o tipo seja 1 (links) e for chamado fazerLinks()
    var caminho

    //desativando as atualizações da simulação
    simulacao.stop()

    //aqui tem que ter uma função propria pra checar e definir degrau pra resolver o bug

    if (degrau < 3) {
        passo_pra_tras.push(caminho_save)
        if (dado.tipo == 0) {
            caminho = "../include/db" + dado.nomeDb + ".csv"

            d3.selectAll("text")
                .style("fill", d => d.id != dado.id && "none")
                .style("stroke", d => d.id != dado.id && "none");


            d3.selectAll("circle")
                .transition()
                .duration(2000)
                .attr("r", d => d.id != dado.id && 1 || tamanho(d.tamanho))
                .style("fill", d => d.id != dado.id && "none")
                .attr("stroke", d => d.id != dado.id && "none" || "white")

            d3.select("#i" + dado.id)
                .transition()
                .duration(2000)
                .attr("cx", width / 2)
                .attr("cy", height / 2)

                .transition()
                .attr("r", 1000)
                .style("fill", "#1B2631")

            d3.selectAll("text")
                .transition()
                .duration(2000)
                    .attr("x", d => d.id == dado.id && width / 2 || d.x)
                    .attr("y", d => d.id == dado.id && height / 2 || d.y)
                
                .transition()
                    .style("fill", d => d.id == dado.id && "#1B2631")

            degrau = 2

            simulacao = d3.forceSimulation()
            sleep(3500).then(() => {
                d3.selectAll("g").remove()
                fazerBolotas(caminho)
            });
        }else{
            //degrau = 3

        }
    }
}
async function transicaoDeVolta() {
    /*aqui eu tenho q pegar todas bolas(q papinho):
    1º diminuir o tamanho delas até n da pra ver elas
    3º chamar a função pra desenhar o gráfico anterior
    */
    simulacao.stop()
    if (degrau > 0) {
        var caminho = passo_pra_tras.pop()
        //if virou raiz e if era folha
        if (passo_pra_tras.length < 1 ) {
            degrau = 0
        } else{if (degrau == 3) {
            degrau = 2
        }}

        d3.selectAll("text")
            .transition()
            .duration(2000)
                .style("fill", "none")
                .style("stroke", "none");


        d3.selectAll("circle")
            .transition()
            .duration(2000)
            .attr("r", 1)
            .style("stroke", "none")
            .style("fill", "#1B2631")

        simulacao = d3.forceSimulation()
        sleep(2000).then(() => {
            d3.selectAll("g").remove()
            fazerBolotas(caminho)
        })
    }
}

async function fazerBolotas(caminho) {
    //lê o CSV
    d3.csv(caminho).then( async function(dadoscsv) {
        var svg = d3
            .select("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "#1B2631");
    
        var coresArray = []
        coresArray = await colunaCor(caminho)
    
        var nomesArray = []
        nomesArray = await colunaNome(caminho)
    
        // Definindo cor das materias
        var cor = d3.scaleOrdinal()
            .domain(nomesArray)
            .range(coresArray);
    
        // definindo a escala
        var min
        min = await pegaMin(caminho)
        var max
        max = await pegaMax(caminho)
        
        
        var tamanho = d3.scaleLinear()
        .domain([min, max]) // valor min e max do db
        .range([min*6, max*5])  // tamanho em px

        var node = svg.append("g")
            .selectAll("circle")
            .data(dadoscsv)
            .join("circle")
            .attr("id", d => "i" + d.id)
            .attr("class", "node")
            .attr("r", d => tamanho(d.tamanho))
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .style("fill", d => cor(d.nome))
            .style("fill-opacity", 0.8)
            .attr("stroke", "white")
            .style("stroke-width", 1)
            .on("click", (event, d) => transicaoDeAvanco(d, tamanho, caminho))
        
        //colocando texto nas bolas
        var texto = svg.append("g")
            .selectAll("text")
            .data(dadoscsv)
            .enter()
            .append("text")
            .style("font", "sans-serif")
            .style("font-size", 15)
            .style("fill", "white")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .text(d => d.nome)
        
        svg.on("click",function(){
            var dentro = event.target.className.baseVal == "node"
            if (!dentro) {
                transicaoDeVolta()
            }
        });

        simulacao
            .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(.1)) // Nodes are attracted one each other of value is > 0
            .force("collide", d3.forceCollide().strength(.2).radius(function(d){ return (tamanho(d.tamanho)+3) }).iterations(1)) // Force that avoids circle overlapping
        
        // Apply these forces to the nodes and update their positions.
        // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
        simulacao.nodes(dadoscsv)
            .on("tick", function(d){
                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                texto
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
            })
    })
}

async function fazerLinks(caminho) {

}

const width = 900
const height = 700
var simulacao = d3.forceSimulation()
//degrau 0 vai ser usado para evitar chamar transicaoDeVolta
degrau = 0
await fazerBolotas("../include/dbENEM.csv");
