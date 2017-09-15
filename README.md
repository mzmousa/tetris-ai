## How to play
1. Click [here](https://cdn.rawgit.com/mzmousa/tetris-ai/1bc4373f/Tetris.html)
2. Clone this repo and open the Tetris.html file in your web browser.

*This will start the algorithm at generation zero. To see its evolved form at generation 25, press SHIFT once it opens*

## This is a Tetris AI that learns to maximize score using a genetic algorithm.

![25th Generation AI](https://github.com/mzmousa/tetris-ai/blob/master/tetris_gameplay.gif?raw=true)

*AI running after 25 generations of evolution*

## How it works

This AI uses evolutionary techniques to improve over time. Through selection, crossover, and mutation, the AI will learn to get the highest score in as few moves as possible (we'll aim for 500 moves).

Genetic algorithms work by creating a population of "genomes" that have multiple "genes", representing parameters for the algorithm. Each of these individuals in the population is evaluated and a "fitness" score for each genome is produced. The fittest individuals would reproduce and pass favourable genes down to the next generation. Mutation also occurs where genes are randomly modified in hopes of creating more beneficial features.

## Analysis

[Rules](http://tetris.wikia.com/wiki/Scoring): Each time a block moves down, the score is incremented by one. When a row is cleared, the score is increased by 400, 1000, 3000, or 12000, depending on how many rows are cleared at once.

The step-by-step algorithm is as follows:
1. Initialize 50 genomes with random values. This is generation 0. A genome is a "moveset" or a Tetris game the AI plays until it loses / reaches 500 moves without losing. An example genome looks like this:

```
{
"id": 0.3633325448484497
"rowsCleared": -0.4579172890221702
"weightedHeight": -0.1247033950880867
"cumulativeHeight": -0.05487475723349933
"relativeHeight": 0.19087878312923057
"holes": 0.1516741306703968
"roughness": -0.11759213555846282
}
```
All the parameters in a genome refer to a weight value:

**id**: The unique identifier for the genome  
**rowsCleared**: The number of rows cleared by the given move  
**weightedHeight**: The absolute height of the highest column  
**cumulativeHeight:**  The sum of all the columns' heights  
**relativeHeight**: The highest column minus the lowest column  
**holes**: All the empty cells with a block above them  
**roughness**: The sum of height differences between adjacent columns  

2. Depending on the genome values, the AI will exhaustively try every possible move given an upcoming shape to optimize for the highest rating, where a rating follows this linear combination:

```
move.getRowsCleared() * genome.rowsCleared +
move.getWeightedHeight() * genome.weightedHeight +
move.getCumulativeHeight() * genome.cumulativeHeight +
move.getRelativeHeight() * genome.relativeHeight +
move.getHoles() * genome.holes +
move.getRoughness() * genome.roughness
```

As you can see, a genome with small values for heights, holes, and roughness, and large values for rowsCleared will achieve the highest score. 

3. A genome's "fitness" is the game score reached before losing the game (hitting the ceiling). After the initial 50 genomes' fitness scores are evaluated, we sort the list of genomes by their fitness value in descending order.

4. Remove the 2nd half of the genomes from the list - we'll only allow the top 50% of the individuals in the genome population to breed/pass on their genes.

5. Create a new array of genomes called children. Put the fittest individual in the array - we sorted genomes previously by fitness, so this will just be genomes[0]. 

6. Time to breed! We need to fill the children array with 50 individuals (we already have one - the fittest individual from generation 0). We randomly select two parent genomes, make a child, and push it into the children array. We create a child by randomly selecting one of the two gene values from the parents for each of the 6 parameters.

7. Next, we randomly mutate the child's gene(s) to try and benefit from it. We set small values for the mutationStep and mutationRate hyperparamaters (0.2 and 0.05 respectively), so we only mutate occasionally. We repeat this for all the children we created using the breeding/crossover step in 6.
```
if (Math.random() < mutationRate) {
	child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
}
```

8. We now have a new genome population called generation 1, with improved genes from generation 0. We repeat steps 2-7 indefinitely.

If you've tried running the AI already, you'll notice the first few individuals don't score too well. However, if you try loading the evolved population at generation 25 (by pressing SHIFT) you'll see how much better it scores.

It would make intuitive sense that in order to maximize score, we would want to maximize the number of rows cleared and minimize all the other parameters (heights, holes, roughness) when calculating move ratings. This seemed to be true in the first few generations, however, once the number of moves started approaching the limit (500) in a generation, the relativeHeight parameter started to increase. We would start seeing the AI stacking blocks up to clear multiple rows at once, getting bonuses of up to 10x as compared to clearing each line individually, which is a **strategy used by high level players** used to maximize score. 

![Multiple Clears](https://github.com/mzmousa/tetris-ai/blob/master/multiple_clears.png?raw=true)

## References

[Coding a Tetris AI using a Genetic Algorithm](https://luckytoilet.wordpress.com/2011/05/27/coding-a-tetris-ai-using-a-genetic-algorithm/)

[Tetris AI – The (Near) Perfect Bot](https://codemyroad.wordpress.com/2013/04/14/tetris-ai-the-near-perfect-player/)

[Evolutionary AI for Tetris](http://www.cs.uml.edu/ecg/uploads/AIfall10/eshahar_rwest_GATetris.pdf)

[Playing Tetris with Genetic Algorithms](http://cs229.stanford.edu/proj2015/238_poster.pdf)

Credits go to Siraj Raval for his educational [AI videos](https://www.youtube.com/channel/UCWN3xxRkmTPmbKwht9FuE5A) on YouTube.
